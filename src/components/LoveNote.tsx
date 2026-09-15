import { motion } from 'framer-motion'
import { LovePhoto } from './LovePhoto'

interface Props {
  id: string
  from: string
  title: string
  lines: string[]
  photo?: string
  onContinue: () => void
}

/** Отдельный тёплый экран-письмо — не «карточка приложения» */
export function LoveNote({ id, from, title, lines, photo, onContinue }: Props) {
  return (
    <motion.div
      className="love-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.article
        className="love-letter"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
      >
        <p className="love-from">{from}</p>
        <h1>{title}</h1>
        <LovePhoto noteId={id} photo={photo} alt={title} />
        <div className="love-lines">
          {lines.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.18 }}
            >
              {line}
            </motion.p>
          ))}
        </div>
        <motion.button
          type="button"
          className="btn love-continue"
          onClick={onContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 + lines.length * 0.18 }}
          whileTap={{ scale: 0.97 }}
        >
          Мне тепло. Дальше
        </motion.button>
      </motion.article>
    </motion.div>
  )
}
