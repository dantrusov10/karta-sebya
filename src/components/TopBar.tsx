import { motion } from 'framer-motion'
import { SESSIONS } from '../data/questions'

interface Props {
  percent: number
  session: 1 | 2 | 3
  chapter: string
  screenIndex: number
  screenTotal: number
  answeredCount: number
  totalAnswerable: number
}

export function TopBar({
  percent,
  session,
  chapter,
  screenIndex,
  screenTotal,
  answeredCount,
  totalAnswerable,
}: Props) {
  const meta = SESSIONS.find((s) => s.id === session)
  return (
    <header className="topbar">
      <div className="topbar-row">
        <div>
          <p className="eyebrow">Часть {session} из 3 · {meta?.title}</p>
          <p className="chapter">{chapter}</p>
        </div>
        <div className="progress-badge" title={`Ответов: ${answeredCount}/${totalAnswerable}`}>
          <span className="progress-pct">{percent}%</span>
          <span className="muted">
            {screenIndex}/{screenTotal}
          </span>
        </div>
      </div>

      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        <motion.div
          className="progress-glow"
          initial={false}
          animate={{ left: `calc(${percent}% - 10px)` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>

      <div className="session-steps">
        {SESSIONS.map((s) => (
          <div
            key={s.id}
            className={`session-step ${s.id === session ? 'on' : ''} ${s.id < session ? 'done' : ''}`}
          >
            <span className="step-dot">{s.id}</span>
            <span className="step-label">{s.title}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
