import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QUESTIONS, SESSIONS, isAnswered } from './data/questions'
import { QuestionView } from './components/QuestionView'
import { TopBar } from './components/TopBar'
import { Welcome } from './components/Welcome'
import { ResultsVault } from './components/ResultsVault'
import { CompleteScreen } from './components/CompleteScreen'
import { Ambient } from './components/Ambient'
import { Celebration } from './components/Celebration'
import { LoveNote } from './components/LoveNote'
import { LOVE_EVERY_N, LOVE_NOTES } from './config'
import {
  buildExport,
  clearState,
  createInitialState,
  loadExport,
  loadState,
  persistExport,
  progressStats,
  saveState,
} from './lib/storage'
import { backupAnswers } from './lib/backup'
import { deliverResults } from './lib/export'
import type { AnswerValue, InterviewExport, InterviewState } from './types'

type Screen = 'welcome' | 'interview' | 'complete' | 'results'

type Gate =
  | null
  | {
      kind: 'cele'
      session: 1 | 2 | 3
      title: string
      subtitle: string
      nextIndex: number
      finish?: boolean
    }
  | {
      kind: 'love'
      noteId: string
      nextIndex: number
      finish?: boolean
    }

function getHashScreen(): Screen | null {
  const h = window.location.hash.replace('#', '')
  if (h === 'results') return 'results'
  if (h === 'interview') return 'interview'
  if (h === 'complete') return 'complete'
  if (h === 'welcome' || h === '') return null
  return null
}

function sessionEndGate(questionId: string, nextIndex: number): Gate {
  if (questionId === 's1_session_end') {
    return {
      kind: 'cele',
      session: 1,
      title: 'Первая часть за тобой',
      subtitle: 'Можно выдохнуть. Дальше — чуть другой разговор.',
      nextIndex,
    }
  }
  if (questionId === 's2_session_end') {
    return {
      kind: 'cele',
      session: 2,
      title: 'Вторая часть собрана',
      subtitle: 'Ты уже многое про себя отметила. Впереди горизонт.',
      nextIndex,
    }
  }
  return null
}

function hasUnfinishedProgress(s: InterviewState): boolean {
  if (s.completedAt) return false
  return (
    s.currentIndex > 0 ||
    Object.keys(s.answers).length > 0 ||
    Object.keys(s.otherTexts).length > 0 ||
    (s.loveNotesShown ?? 0) > 0
  )
}

export default function App() {
  const [state, setState] = useState<InterviewState>(() => loadState())
  const [screen, setScreen] = useState<Screen>(() => {
    const fromHash = getHashScreen()
    if (fromHash === 'results' || fromHash === 'interview' || fromHash === 'complete') {
      return fromHash
    }
    return 'welcome'
  })
  const [customChip, setCustomChip] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [gate, setGate] = useState<Gate>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<{
    downloaded: boolean
    webhook: 'ok' | 'skip' | 'error'
    shared: boolean
    copied: boolean
  }>({
    downloaded: false,
    webhook: 'skip',
    shared: false,
    copied: false,
  })
  const [exportData, setExportData] = useState<InterviewExport | null>(() => loadExport())
  const [dir, setDir] = useState(1)

  const stateRef = useRef(state)
  stateRef.current = state

  const safeIndex = Math.min(Math.max(0, state.currentIndex), QUESTIONS.length - 1)
  const question = QUESTIONS[safeIndex]
  const stats = useMemo(
    () => progressStats({ ...state, currentIndex: safeIndex }),
    [state, safeIndex],
  )
  const canContinue = hasUnfinishedProgress(state)

  // Автосохранение на каждом изменении (ответ, индекс, послания…)
  useEffect(() => {
    saveState(state)
  }, [state])

  // Тихий бэкап на сервер, чтобы ответы не жили только в телефоне
  useEffect(() => {
    if (stats.answeredCount < 1) return
    const t = window.setTimeout(() => {
      void backupAnswers(buildExport(stateRef.current), 'progress')
    }, 8000)
    return () => window.clearTimeout(t)
  }, [stats.answeredCount])

  // Доп. страховка: при сворачивании / закрытии вкладки
  useEffect(() => {
    const flush = () => saveState(stateRef.current)
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  useEffect(() => {
    if (state.currentIndex !== safeIndex) {
      setState((prev) => ({ ...prev, currentIndex: safeIndex }))
    }
  }, [safeIndex, state.currentIndex])

  useEffect(() => {
    const onHash = () => {
      const s = getHashScreen()
      if (s) setScreen(s)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const setAnswer = (value: AnswerValue) => {
    if (!question) return
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [question.id]: value },
    }))
  }

  const setOtherText = (text: string) => {
    if (!question) return
    setState((prev) => ({
      ...prev,
      otherTexts: { ...prev.otherTexts, [question.id]: text },
    }))
  }

  const goTo = (index: number, direction: number) => {
    const clamped = Math.min(Math.max(0, index), QUESTIONS.length - 1)
    setDir(direction)
    setCustomChip('')
    setState((prev) => ({ ...prev, currentIndex: clamped }))
  }

  const canProceed = question
    ? !question.required || isAnswered(question, state.answers[question.id])
    : false

  const finish = async (sourceState?: InterviewState) => {
    const base = sourceState ?? state
    const completedAt = new Date().toISOString()
    const nextState: InterviewState = {
      ...base,
      currentIndex: QUESTIONS.length - 1,
      completedAt,
    }
    setState(nextState)
    const data = buildExport(nextState)
    persistExport(data)
    setExportData(data)
    const status = await deliverResults(data, { autoShare: false })
    setDeliveryStatus(status)
    setScreen('complete')
    window.location.hash = 'complete'
  }

  const advanceFromGate = async (g: Gate) => {
    if (!g) return
    if (g.kind === 'cele') {
      if (g.finish) {
        setGate(null)
        await finish()
        return
      }
      setGate(null)
      goTo(g.nextIndex, 1)
      return
    }
    if (g.kind === 'love') {
      if (g.finish) {
        setGate(null)
        await finish()
        return
      }
      setGate(null)
      goTo(g.nextIndex, 1)
    }
  }

  const maybeLoveGate = (nextIndex: number, doFinish?: boolean): Gate => {
    const answered = progressStats(state).answeredCount
    const due = Math.floor(answered / LOVE_EVERY_N)
    if (due > state.loveNotesShown && state.loveNotesShown < LOVE_NOTES.length) {
      const note = LOVE_NOTES[state.loveNotesShown]
      setState((prev) => ({ ...prev, loveNotesShown: prev.loveNotesShown + 1 }))
      return {
        kind: 'love',
        noteId: note.id,
        nextIndex,
        finish: doFinish,
      }
    }
    return null
  }

  const next = async () => {
    if (!question) return

    if (safeIndex >= QUESTIONS.length - 1) {
      const love = maybeLoveGate(safeIndex, true)
      if (love) {
        setGate(love)
        return
      }
      setGate({
        kind: 'cele',
        session: 3,
        title: 'Ты собрала всю карту',
        subtitle: 'Дальше — сохранить и отправить Даниле.',
        nextIndex: safeIndex,
        finish: true,
      })
      return
    }

    const nextIndex = safeIndex + 1

    const cele = sessionEndGate(question.id, nextIndex)
    if (cele) {
      setGate(cele)
      return
    }

    if (question.type !== 'intro' && question.type !== 'surprise') {
      const love = maybeLoveGate(nextIndex)
      if (love) {
        setGate(love)
        return
      }
    }

    goTo(nextIndex, 1)
  }

  const back = () => {
    if (safeIndex <= 0) {
      setScreen('welcome')
      window.location.hash = 'welcome'
      return
    }
    goTo(safeIndex - 1, -1)
  }

  const saveAndExit = () => {
    saveState(stateRef.current)
    setToast('Сохранено. Можно закрыть — потом продолжишь с этого же места')
    setScreen('welcome')
    window.location.hash = 'welcome'
  }

  const startFresh = () => {
    if (canContinue && !confirm('Начать заново и стереть текущие ответы?')) return
    clearState()
    setState(createInitialState())
    setExportData(null)
    setGate(null)
    setScreen('interview')
    window.location.hash = 'interview'
  }

  const continueInterview = () => {
    setScreen('interview')
    window.location.hash = 'interview'
  }

  const loveNote =
    gate?.kind === 'love' ? LOVE_NOTES.find((n) => n.id === gate.noteId) : null

  const ambientSession: 1 | 2 | 3 =
    screen === 'interview' && question ? question.session : 1

  return (
    <>
      <Ambient session={ambientSession} />
      <div className={`stage-3d world-${ambientSession}`}>
        <AnimatePresence mode="wait">
          {screen === 'welcome' && (
            <Welcome
              key="welcome"
              onStart={startFresh}
              onContinue={continueInterview}
              hasProgress={canContinue}
              percent={stats.percent}
            />
          )}

          {screen === 'results' && (
            <ResultsVault
              key="results"
              data={exportData ?? buildExport(state)}
              onBack={() => {
                setScreen(state.completedAt ? 'complete' : 'welcome')
                window.location.hash = state.completedAt ? 'complete' : 'welcome'
              }}
            />
          )}

          {screen === 'complete' && (
            <CompleteScreen
              key="complete"
              status={deliveryStatus}
              data={exportData}
              onResults={() => {
                setScreen('results')
                window.location.hash = 'results'
              }}
              onHome={() => {
                setScreen('welcome')
                window.location.hash = 'welcome'
              }}
            />
          )}

          {screen === 'interview' && question && (
            <div className={`shell interview interview-s${question.session}`} key="interview">
              <TopBar
                percent={stats.percent}
                session={question.session}
                chapter={question.chapter}
                screenIndex={stats.screenIndex}
                screenTotal={stats.screenTotal}
                answeredCount={stats.answeredCount}
                totalAnswerable={stats.totalQuestions}
              />

              <div className="interview-body">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={question.id}
                    className={`question-panel tone-${question.session}`}
                    custom={dir}
                    initial={{ opacity: 0, x: dir * 40, rotateY: dir * 10, z: -60 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0, z: 0 }}
                    exit={{ opacity: 0, x: dir * -36, rotateY: dir * -8, z: -40 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                    style={{ transformPerspective: 1100 }}
                  >
                    <div className="panel-watermark">{question.session}</div>
                    <p className="session-tag">
                      {SESSIONS.find((s) => s.id === question.session)?.title}
                    </p>
                    <h2>{question.title}</h2>
                    {question.subtitle &&
                      question.type !== 'intro' &&
                      question.type !== 'surprise' && (
                        <p className="q-sub">{question.subtitle}</p>
                      )}
                    <QuestionView
                      question={question}
                      value={state.answers[question.id]}
                      otherText={state.otherTexts[question.id] ?? ''}
                      onChange={setAnswer}
                      onOtherText={setOtherText}
                      customChip={customChip}
                      onCustomChip={setCustomChip}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <footer className="footer-nav">
                <button type="button" className="btn ghost" onClick={back}>
                  Назад
                </button>
                <button type="button" className="btn soft" onClick={saveAndExit}>
                  Сохранить и выйти
                </button>
                <motion.button
                  type="button"
                  className="btn primary"
                  disabled={
                    question.type !== 'intro' &&
                    question.type !== 'surprise' &&
                    !!question.required &&
                    !canProceed
                  }
                  onClick={next}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {safeIndex >= QUESTIONS.length - 1
                    ? 'Завершить'
                    : question.type === 'intro' || question.type === 'surprise'
                      ? 'Дальше'
                      : canProceed || !question.required
                        ? 'Дальше'
                        : 'Выбери ответ'}
                </motion.button>
              </footer>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Celebration
        open={gate?.kind === 'cele'}
        session={gate?.kind === 'cele' ? gate.session : 1}
        title={gate?.kind === 'cele' ? gate.title : ''}
        subtitle={gate?.kind === 'cele' ? gate.subtitle : ''}
        onContinue={() => advanceFromGate(gate)}
      />

      <AnimatePresence>
        {gate?.kind === 'love' && loveNote && (
          <LoveNote
            key={loveNote.id}
            id={loveNote.id}
            from={loveNote.from}
            title={loveNote.title}
            lines={loveNote.lines}
            photo={loveNote.photo}
            onContinue={() => advanceFromGate(gate)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
