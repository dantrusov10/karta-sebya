import { motion } from 'framer-motion'

const scenes = {
  1: (
    <svg viewBox="0 0 360 120" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5f9a8e" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#163f3a" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" rx="22" fill="url(#g1)" />
      <circle cx="300" cy="36" r="32" fill="#f3e8d8" opacity="0.5" />
      <path
        d="M28 92c40-48 88-62 138-42 28 12 48 8 72-10 32-24 68-18 96 10"
        stroke="#0f2e2a"
        strokeWidth="2.2"
        fill="none"
        opacity="0.4"
      />
      <path d="M64 84c10-28 34-40 54-30 14 6 20 18 16 34" fill="#1f4f49" opacity="0.4" />
      <path d="M120 88c8-20 24-30 40-22 10 5 14 14 12 26" fill="#a86565" opacity="0.32" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 360 120" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4917a" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#8f5e5e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2a6a61" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" rx="22" fill="url(#g2)" />
      <rect x="40" y="28" width="64" height="68" rx="14" fill="#fff" opacity="0.42" />
      <rect x="118" y="20" width="64" height="76" rx="14" fill="#fff" opacity="0.32" />
      <rect x="196" y="32" width="64" height="64" rx="14" fill="#fff" opacity="0.38" />
      <circle cx="300" cy="40" r="22" fill="#163f3a" opacity="0.22" />
      <path d="M48 88h48M126 92h40" stroke="#163f3a" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 360 120" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#163f3a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e2c99a" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" rx="22" fill="url(#g3)" />
      <path
        d="M20 88c50-58 110-78 170-58 48 16 88 6 140-28"
        stroke="#fff8e8"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
      />
      <circle cx="288" cy="34" r="26" fill="#fff8e8" opacity="0.28" />
      <path d="M48 96h88M48 104h56" stroke="#fff8e8" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <circle cx="72" cy="40" r="4" fill="#fff" opacity="0.5" />
      <circle cx="96" cy="28" r="3" fill="#fff" opacity="0.35" />
    </svg>
  ),
} as const

export function SessionScene({ session }: { session: 1 | 2 | 3 }) {
  return (
    <motion.div
      className={`session-scene session-scene-${session}`}
      key={session}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      {scenes[session]}
    </motion.div>
  )
}

export function Ambient({ session = 1 }: { session?: 1 | 2 | 3 }) {
  return (
    <div className={`ambient ambient-s${session}`} aria-hidden>
      <motion.div
        className="mesh mesh-a"
        animate={{ rotate: [0, 8, -4, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="mesh mesh-b"
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="mesh mesh-c"
        animate={{ opacity: [0.35, 0.55, 0.4, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
