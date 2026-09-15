import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'

interface Props {
  open: boolean
  session: 1 | 2 | 3
  title: string
  subtitle: string
  onContinue: () => void
}

const labels = {
  1: 'Часть 1 пройдена',
  2: 'Часть 2 пройдена',
  3: 'Финиш близко',
}

export function Celebration({ open, session, title, subtitle, onContinue }: Props) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 17) % 88)}%`,
        delay: (i % 10) * 0.05,
        size: 6 + (i % 5) * 3,
        hue: i % 3 === 0 ? '#8fbeb4' : i % 3 === 1 ? '#a86565' : '#e7d7b8',
      })),
    [],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cele-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {sparks.map((s) => (
            <motion.span
              key={s.id}
              className="cele-spark"
              style={{ left: s.left, width: s.size, height: s.size, background: s.hue }}
              initial={{ y: '110vh', opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{ y: '-20vh', opacity: [0, 1, 1, 0], rotate: 220, scale: 1 }}
              transition={{ duration: 2.2 + (s.id % 5) * 0.15, delay: s.delay, ease: 'easeOut' }}
            />
          ))}

          <motion.div
            className="cele-card"
            initial={{ opacity: 0, scale: 0.86, rotateX: 18, y: 30 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          >
            <p className="cele-kicker">{labels[session]}</p>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <button type="button" className="btn primary" onClick={onContinue}>
              Дальше
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
