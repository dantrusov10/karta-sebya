import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { DELIVERY } from '../config'
import { downloadJson, formatHumanSummary, shareResultsFile } from '../lib/export'
import type { InterviewExport } from '../types'

interface Props {
  data: InterviewExport
  onBack: () => void
}

export function ResultsVault({ data, onBack }: Props) {
  const summary = useMemo(() => formatHumanSummary(data), [data])
  const [copied, setCopied] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)

  const copySummary = async () => {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendShare = async () => {
    const outcome = await shareResultsFile(data)
    setShareNote(
      outcome === 'shared_system'
        ? 'Выбери MAX в окне «Поделиться» и отправь файл.'
        : 'Файл скачан, текст в буфере. MAX → чат → вставь / приложи .txt из Загрузок.',
    )
  }

  return (
    <motion.section
      className="shell results"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="results-card">
        <p className="eyebrow">Для {DELIVERY.husbandName}</p>
        <h1>Результаты</h1>
        <p className="lede">
          Отвечено {data.meta.answeredCount} из {data.meta.totalQuestions} (
          {data.meta.progressPercent}%).
        </p>

        <pre className="summary-box">{summary}</pre>
        {shareNote && <p className="tg-note">{shareNote}</p>}

        <div className="welcome-actions">
          <button type="button" className="btn primary" onClick={sendShare}>
            Отправить в MAX
          </button>
          <button type="button" className="btn soft" onClick={() => downloadJson(data)}>
            Скачать JSON
          </button>
          <button type="button" className="btn soft" onClick={copySummary}>
            {copied ? 'Скопировано' : 'Скопировать краткое'}
          </button>
          <button type="button" className="btn ghost" onClick={onBack}>
            Назад
          </button>
        </div>
      </div>
    </motion.section>
  )
}
