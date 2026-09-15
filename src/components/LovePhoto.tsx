import { useState } from 'react'
import { motion } from 'framer-motion'

const EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const

/** Пробует /love/{id}.jpg|png|webp — если файла нет, ничего не рисует */
export function LovePhoto({
  noteId,
  photo,
  alt,
}: {
  noteId: string
  photo?: string
  alt: string
}) {
  const candidates = photo
    ? [photo]
    : EXTS.map((ext) => `${import.meta.env.BASE_URL}love/${noteId}.${ext}`)

  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const src = candidates[idx]

  if (failed || !src) return null

  return (
    <motion.div
      className="love-photo-wrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <img
        className="love-photo"
        src={src}
        alt={alt}
        onError={() => {
          if (idx + 1 < candidates.length) setIdx((v) => v + 1)
          else setFailed(true)
        }}
      />
    </motion.div>
  )
}
