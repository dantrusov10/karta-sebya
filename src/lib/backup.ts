import { DELIVERY } from '../config'
import type { InterviewExport } from '../types'

const topic = () => DELIVERY.ntfyTopic.trim()

/** Тихий бэкап JSON, чтобы ответы не жили только в телефоне. */
export async function backupAnswers(
  data: InterviewExport,
  kind: 'progress' | 'complete',
): Promise<'ok' | 'skip' | 'error'> {
  if (!topic()) return 'skip'
  if (kind === 'progress' && data.meta.answeredCount < 1) return 'skip'

  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic())}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        Title:
          kind === 'complete'
            ? 'Карта себя — готово'
            : `Карта себя — ${data.meta.answeredCount}/${data.meta.totalQuestions}`,
        Filename: `career-interview-${kind}.json`,
        Tags: kind === 'complete' ? 'white_check_mark' : 'pencil',
      },
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export function backupInboxUrl() {
  return topic() ? `https://ntfy.sh/${encodeURIComponent(topic())}` : ''
}
