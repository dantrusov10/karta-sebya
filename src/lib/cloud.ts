import { DELIVERY } from '../config'
import { createInitialState } from './storage'
import type { InterviewState } from '../types'

export const GIST_ID = '6875b75882f26e43380a56279b63fb3d'
export const GIST_FILE = 'state.json'
export const REPO_STATE_PATH = 'answers/state.json'

type CloudEnvelope = {
  type: 'karta-state'
  savedAt: string
  state: InterviewState
}

function topic() {
  return DELIVERY.ntfyTopic.trim()
}

export function isUsableState(value: unknown): value is InterviewState {
  if (!value || typeof value !== 'object') return false
  const s = value as InterviewState
  return Boolean(s.answers) && typeof s.answers === 'object'
}

export function normalizeState(parsed: InterviewState): InterviewState {
  const base = createInitialState()
  return {
    ...base,
    ...parsed,
    version: 7,
    answers: parsed.answers ?? {},
    otherTexts: parsed.otherTexts ?? {},
    sessionBreakSeen: parsed.sessionBreakSeen ?? [],
    loveNotesShown: parsed.loveNotesShown ?? 0,
    completedAt: parsed.completedAt ?? null,
    updatedAt: parsed.updatedAt || parsed.startedAt || base.updatedAt,
  }
}

function envelope(state: InterviewState): CloudEnvelope {
  return {
    type: 'karta-state',
    savedAt: state.updatedAt || new Date().toISOString(),
    state,
  }
}

function parseEnvelope(raw: unknown): InterviewState | null {
  if (isUsableState(raw)) return normalizeState(raw)
  if (raw && typeof raw === 'object' && 'state' in raw) {
    const inner = (raw as CloudEnvelope).state
    if (isUsableState(inner)) return normalizeState(inner)
  }
  return null
}

async function pullGist(): Promise<InterviewState | null> {
  const url = `https://gist.githubusercontent.com/dantrusov10/${GIST_ID}/raw/${GIST_FILE}?t=${Date.now()}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return parseEnvelope(await res.json())
  } catch {
    return null
  }
}

async function pullRepoFile(): Promise<InterviewState | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/dantrusov10/karta-sebya/contents/${REPO_STATE_PATH}?t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github.raw+json' },
      },
    )
    if (!res.ok) return null
    return parseEnvelope(await res.json())
  } catch {
    return null
  }
}

type NtfyLine = {
  event?: string
  message?: string
  attachment?: { url?: string }
}

async function pullNtfy(): Promise<InterviewState | null> {
  if (!topic()) return null
  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic())}/json?poll=1`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    let best: InterviewState | null = null
    for (const line of lines) {
      let parsed: NtfyLine
      try {
        parsed = JSON.parse(line) as NtfyLine
      } catch {
        continue
      }
      if (parsed.event && parsed.event !== 'message') continue
      let raw: unknown = parsed.message
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw)
        } catch {
          raw = null
        }
      }
      if (!raw && parsed.attachment?.url) {
        try {
          const att = await fetch(parsed.attachment.url, { cache: 'no-store' })
          if (att.ok) raw = await att.json()
        } catch {
          raw = null
        }
      }
      const state = parseEnvelope(raw)
      if (!state) continue
      if (!best || Date.parse(state.updatedAt) > Date.parse(best.updatedAt)) best = state
    }
    return best
  } catch {
    return null
  }
}

function newer(a: InterviewState | null, b: InterviewState | null): InterviewState | null {
  if (!a) return b
  if (!b) return a
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b
}

/** С любого устройства: gist / файл в репо / ntfy, берём самый свежий. */
export async function pullCloud(): Promise<InterviewState | null> {
  const [gist, repo, ntfy] = await Promise.all([pullGist(), pullRepoFile(), pullNtfy()])
  return newer(newer(gist, repo), ntfy)
}

async function pushNtfy(state: InterviewState): Promise<'ok' | 'error'> {
  if (!topic()) return 'error'
  const payload = JSON.stringify(envelope(state))
  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic())}`, {
      method: 'PUT',
      body: payload,
      headers: {
        Title: `Карта себя — сохранено`,
        Filename: 'karta-state.json',
        Tags: 'floppy_disk',
      },
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

async function pushGist(state: InterviewState): Promise<'ok' | 'skip' | 'error'> {
  const token = DELIVERY.githubToken?.trim()
  if (!token) return 'skip'
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'karta-sebya',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILE]: { content: JSON.stringify(envelope(state), null, 2) },
        },
      }),
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export async function pushCloud(state: InterviewState, opts?: { force?: boolean }): Promise<void> {
  const answered = Object.keys(state.answers || {}).length
  if (!opts?.force && answered < 1 && !state.completedAt) return
  await Promise.all([pushNtfy(state), pushGist(state)])
}
