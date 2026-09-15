import { DELIVERY } from '../config'
import { backupAnswers } from './backup'
import type { InterviewExport } from '../types'

export function downloadJson(data: InterviewExport, filename?: string) {
  const name =
    filename ??
    `career-interview-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function formatHumanSummary(data: InterviewExport): string {
  const lines: string[] = [
    `${data.meta.title} — результаты`,
    `Дата: ${new Date(data.meta.exportedAt).toLocaleString('ru-RU')}`,
    `Отвечено: ${data.meta.answeredCount}/${data.meta.totalQuestions} (${data.meta.progressPercent}%)`,
    '',
    'Ключевые ответы:',
  ]

  const highlightIds = [
    's1_name_feel',
    's1_mood',
    's1_drive_style',
    's1_people_charge',
    's1_structure_need',
    's1_precision',
    's1_environment',
    's1_crisis',
    's1_stakes',
    's1_living_systems',
    's1_protect',
    's1_values',
    's1_nonnegotiable',
    's2_interest_clusters',
    's2_wild_pull',
    's2_study_horizon',
    's2_hard_ok',
    's2_start_path',
    's2_strengths_self',
    's2_schedule',
    's2_risk',
    's3_dream_day',
    's3_dream_custom',
    's3_segment_pull',
    's3_job_vs_project',
    's3_money_need',
    's3_curiosity_themes',
    's3_curiosity_open',
    's3_feeling_role',
    's3_open_letter',
  ]

  for (const id of highlightIds) {
    const row = data.answers.find((a) => a.id === id)
    if (!row || row.answer === null || row.answer === undefined || row.answer === '') continue
    const value = Array.isArray(row.answer) ? row.answer.join(', ') : String(row.answer)
    lines.push(`• ${row.title}`)
    lines.push(`  → ${value}`)
    if (row.otherText) lines.push(`  (ещё: ${row.otherText})`)
  }

  lines.push('', `Для ${DELIVERY.husbandName}: полный JSON ниже / во вложении.`)
  return lines.join('\n')
}

/** Полный пакет в одном файле — и краткое, и JSON */
export function buildSharePayloadFile(data: InterviewExport): File {
  const stamp = new Date().toISOString().slice(0, 10)
  const body = [
    formatHumanSummary(data),
    '',
    '========== FULL JSON ==========',
    JSON.stringify(data, null, 2),
  ].join('\n')

  return new File([body], `career-interview-${stamp}.txt`, {
    type: 'text/plain',
  })
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

/** Короткий текст: длинный URL на iOS ломает MAX («ссылка устарела») */
export function buildMaxShareText(data: InterviewExport): string {
  return [
    `«${data.meta.title}» для ${DELIVERY.husbandName}`,
    `Отвечено ${data.meta.answeredCount}/${data.meta.totalQuestions} (${data.meta.progressPercent}%).`,
    '',
    'Полный файл .txt уже в Загрузках — приложи скрепкой в этот чат.',
  ].join('\n')
}

export function openMaxShare(text: string) {
  const url = `https://max.ru/:share?text=${encodeURIComponent(text)}`
  // same-tab надёжнее на iOS, чем target=_blank
  window.location.assign(url)
}

export type ShareOutcome = 'opened_max' | 'shared_system' | 'copied_fallback'

/**
 * 1) скачать .txt
 * 2) скопировать краткий текст
 * 3) попробовать системный share (выбрать MAX)
 * 4) иначе открыть короткий диплинк MAX
 */
export async function shareResultsFile(data: InterviewExport): Promise<ShareOutcome> {
  const file = buildSharePayloadFile(data)
  const shortText = buildMaxShareText(data)
  downloadFile(file)

  try {
    await navigator.clipboard.writeText(shortText)
  } catch {
    /* ignore */
  }

  const canFileShare =
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  if (canFileShare) {
    try {
      await navigator.share({
        files: [file],
        title: data.meta.title,
      })
      return 'shared_system'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // пользователь закрыл шару — всё равно дадим MAX
      }
    }
  }

  // короткий диплинк (без гигантского summary в URL)
  openMaxShare(shortText)
  return 'opened_max'
}

export async function deliverResults(
  data: InterviewExport,
  opts?: { autoShare?: boolean },
): Promise<{
  downloaded: boolean
  webhook: 'ok' | 'skip' | 'error'
  shared: boolean
  copied: boolean
}> {
  const file = buildSharePayloadFile(data)
  downloadFile(file)

  let copied = false
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    copied = true
  } catch {
    /* ignore */
  }

  let webhook: 'ok' | 'skip' | 'error' = 'skip'
  if (DELIVERY.webhookUrl.trim()) {
    try {
      const res = await fetch(DELIVERY.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      webhook = res.ok ? 'ok' : 'error'
    } catch {
      webhook = 'error'
    }
  }

  const ntfy = await backupAnswers(data, 'complete')
  if (webhook === 'skip') webhook = ntfy

  let shared = false
  if (opts?.autoShare) {
    const outcome = await shareResultsFile(data)
    shared = outcome === 'opened_max' || outcome === 'shared_system'
  }

  return { downloaded: true, webhook, shared, copied }
}
