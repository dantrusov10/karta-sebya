import { readFileSync, writeFileSync } from 'fs'

const path = 'src/data/questions.ts'
let s = readFileSync(path, 'utf8')

s = s.replace(
  /import \{ personalComplimentPool \} from '\.\.\/config'\r?\n\r?\nconst C = personalComplimentPool\(\)\r?\n\r?\n/,
  '',
)

const removeIds = [
  's1_surprise_1',
  's1_surprise_after_past',
  's2_surprise_after_courses',
  's2_surprise_after_interests',
  's2_surprise_mid',
  's2_surprise_before_end',
  's3_surprise_after_dream',
  's3_surprise_end',
]

for (const id of removeIds) {
  const re = new RegExp(
    `  \\{\\s*id: '${id}'[\\s\\S]*?surpriseEmoji: '[^']*',\\s*},\\n`,
    'm',
  )
  if (!re.test(s)) {
    console.log('MISS', id)
    continue
  }
  s = s.replace(re, '')
  console.log('OK', id)
}

// Remaining session-end surprises -> plain intros, no emoji fluff
s = s.replace(/type: 'surprise'/g, "type: 'intro'")
s = s.replace(/\n\s*surpriseEmoji: '[^']*',/g, '')

s = s.replace('career-self-interview-v3', 'career-self-interview-v4')

// Neutral session-end copy (no compliments)
s = s.replace(
  /id: 's1_session_end'[\s\S]*?subtitle:\s*\n?\s*\(C\[[\s\S]*?surpriseEmoji: '[^']*',/,
  '',
)

writeFileSync(path, s)
console.log('written')
