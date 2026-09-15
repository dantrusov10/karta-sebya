import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LOVE_NOTES } from '../config'
import { LovePhoto } from './LovePhoto'

interface Props {
  onClose: () => void
}

/** Предпросмотр всех посланий подряд */
export function LovePreview({ onClose }: Props) {
  const [index, setIndex] = useState(0)
  const note = LOVE_NOTES[index]
  const isLast = index >= LOVE_NOTES.length - 1

  if (!note) {
    onClose()
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={note.id}
        className="love-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="love-card"
          initial={{ opacity: 0, y: 36, rotateX: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ transformPerspective: 1000 }}
        >
          <div className="love-glow" />
          <motion.div
            className="love-orb"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="love-from">
            {note.from} · {index + 1}/{LOVE_NOTES.length}
          </p>
          <h1>{note.title}</h1>
          <LovePhoto noteId={note.id} photo={note.photo} alt={note.title} />
          <div className="love-lines">
            {note.lines.map((line, i) => (
              <motion.p
                key={`${note.id}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12 }}
              >
                {line}
              </motion.p>
            ))}
          </div>
          <div className="love-preview-actions">
            {index > 0 && (
              <button type="button" className="btn ghost" onClick={() => setIndex((v) => v - 1)}>
                Назад
              </button>
            )}
            <motion.button
              type="button"
              className="btn primary"
              onClick={() => {
                if (isLast) onClose()
                else setIndex((v) => v + 1)
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {isLast ? 'Закрыть' : 'Следующее послание'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
