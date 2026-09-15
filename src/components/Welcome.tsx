import { motion } from 'framer-motion'
import { APP } from '../config'
import { SESSIONS } from '../data/questions'

interface Props {
  onStart: () => void
  onContinue: () => void
  hasProgress: boolean
  percent: number
  cloudReady?: boolean
}

export function Welcome({ onStart, onContinue, hasProgress, percent, cloudReady = true }: Props) {
  return (
    <motion.section
      className="shell welcome"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="welcome-hero">
        <div className="welcome-hero-visual" aria-hidden>
          <div className="welcome-orb welcome-orb-a" />
          <div className="welcome-orb welcome-orb-b" />
          <svg className="welcome-path" viewBox="0 0 320 200" fill="none">
            <path
              d="M24 150c48-70 96-95 150-70 42 20 72 12 120-28"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.35"
            />
            <circle cx="250" cy="48" r="36" fill="currentColor" opacity="0.12" />
          </svg>
        </div>

        <p className="brand welcome-brand">{APP.title}</p>
        <h1>Найдём, куда тебе тепло</h1>
        <p className="lede welcome-lede">
          {APP.subtitle}. Три части про то, как ты устроена и куда тянет — не про старое резюме.
          Ответы сами сохраняются в облако: можно закрыть и продолжить с любого телефона по этой же
          ссылке.
        </p>

        <p className="welcome-parts" aria-label="Три части">
          {SESSIONS.map((s, i) => (
            <span key={s.id}>
              {i > 0 && <span className="welcome-parts-sep" aria-hidden>
                ·
              </span>}
              <em>{s.title}</em>
              <span className="welcome-parts-time">{s.duration.replace('≈ ', '')}</span>
            </span>
          ))}
        </p>

        <div className="welcome-actions">
          {!cloudReady ? (
            <p className="lede welcome-lede">Достаю сохранённые ответы…</p>
          ) : hasProgress ? (
            <>
              <button type="button" className="btn primary" onClick={onContinue}>
                Продолжить · {percent}%
              </button>
              <button type="button" className="btn ghost" onClick={onStart}>
                Начать заново
              </button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={onStart}>
              Начать мягко
            </button>
          )}
        </div>
      </div>
    </motion.section>
  )
}
