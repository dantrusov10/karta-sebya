import { QUESTIONS, STORAGE_KEY, countableQuestions, isAnswered } from '../data/questions'
import type { AnswerValue, InterviewExport, InterviewState } from '../types'
import { PROFILE_HINTS, SESSIONS } from '../data/questions'
import { APP } from '../config'

export function createInitialState(): InterviewState {
  const now = new Date().toISOString()
  return {
    version: 7,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    currentIndex: 0,
    answers: {},
    otherTexts: {},
    sessionBreakSeen: [],
    loveNotesShown: 0,
  }
}

export function loadState(): InterviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as InterviewState
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) {
      return createInitialState()
    }
    const base = createInitialState()
    const currentIndex = Math.min(
      Math.max(0, parsed.currentIndex ?? 0),
      Math.max(0, QUESTIONS.length - 1),
    )
    return {
      ...base,
      ...parsed,
      version: 7,
      currentIndex,
      answers: parsed.answers ?? {},
      otherTexts: parsed.otherTexts ?? {},
      sessionBreakSeen: parsed.sessionBreakSeen ?? [],
      completedAt: parsed.completedAt ?? null,
      loveNotesShown: parsed.loveNotesShown ?? 0,
    }
  } catch {
    return createInitialState()
  }
}

export function saveState(state: InterviewState): void {
  const next = { ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(`${STORAGE_KEY}:export`)
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7']) {
    localStorage.removeItem(`career-self-interview-${v}`)
    localStorage.removeItem(`career-self-interview-${v}:export`)
  }
}

export function progressStats(state: InterviewState) {
  const countable = countableQuestions()
  const answered = countable.filter((q) => isAnswered(q, state.answers[q.id]))
  const percent = Math.round((answered.length / Math.max(countable.length, 1)) * 100)
  return {
    answeredCount: answered.length,
    totalQuestions: countable.length,
    percent: Number.isFinite(percent) ? percent : 0,
    screenIndex: state.currentIndex + 1,
    screenTotal: QUESTIONS.length,
  }
}

export function buildExport(state: InterviewState): InterviewExport {
  const stats = progressStats(state)
  return {
    meta: {
      title: APP.title,
      exportedAt: new Date().toISOString(),
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      progressPercent: stats.percent,
      answeredCount: stats.answeredCount,
      totalQuestions: stats.totalQuestions,
    },
    profileHints: PROFILE_HINTS,
    sessions: SESSIONS,
    answers: QUESTIONS.filter((q) => q.type !== 'intro' && q.type !== 'surprise').map((q) => ({
      id: q.id,
      session: q.session,
      chapter: q.chapter,
      title: q.title,
      type: q.type,
      answer: (state.answers[q.id] ?? null) as AnswerValue,
      otherText: state.otherTexts[q.id] || undefined,
    })),
  }
}

export function persistExport(data: InterviewExport): void {
  localStorage.setItem(`${STORAGE_KEY}:export`, JSON.stringify(data))
}

export function loadExport(): InterviewExport | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:export`)
    if (!raw) return null
    return JSON.parse(raw) as InterviewExport
  } catch {
    return null
  }
}
