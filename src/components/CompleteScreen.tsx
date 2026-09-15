import { useState } from 'react'
import { motion } from 'framer-motion'
import { downloadJson, shareResultsFile } from '../lib/export'
import type { InterviewExport } from '../types'

interface Props {
  status: {
    downloaded: boolean
    webhook: 'ok' | 'skip' | 'error'
    shared: boolean
    copied: boolean
  }
  data: InterviewExport | null
  onResults: () => void
  onHome: () => void
}

export function CompleteScreen({ status, data, onResults, onHome }: Props) {
  const [shareNote, setShareNote] = useState<string | null>(null)

  const sendShare = async () => {
    if (!data) return
    const outcome = await shareResultsFile(data)
    if (outcome === 'shared_system') {
      setShareNote(
        'Открылось «Поделиться» — выбери MAX и отправь файл. Если MAX нет в списке: файл в Загрузках → открой MAX вручную → скрепка → Файл.',
      )
    } else {
      setShareNote(
        'Файл .txt скачан, короткий текст скопирован. Если MAX открылся — выбери чат и приложи файл. Если снова «ссылка не работает»: MAX → чат с Данилой → вставь из буфера → скрепка → .txt из Загрузок.',
      )
    }
  }

  return (
    <motion.section
      className="shell complete"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="welcome-card">
        <p className="brand">Готово</p>
        <h1>Ответы сохранены</h1>
        <p className="lede">
          Сначала скачается файл <strong>.txt</strong>. Потом — либо системное «Поделиться» (выбери
          MAX), либо короткий переход в MAX. Длинные ссылки на iPhone часто ломаются — поэтому текст
          короткий, полный отчёт в файле.
        </p>
        <ul className="status-list">
          <li>{status.downloaded ? 'Копия файла также в Загрузках' : 'Файл можно скачать ниже'}</li>
        </ul>
        {shareNote && <p className="tg-note">{shareNote}</p>}
        <div className="welcome-actions">
          <button type="button" className="btn primary" onClick={sendShare} disabled={!data}>
            Отправить в MAX
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() => data && downloadJson(data)}
            disabled={!data}
          >
            Скачать JSON
          </button>
          <button type="button" className="btn soft" onClick={onResults}>
            Открыть результаты
          </button>
          <button type="button" className="btn ghost" onClick={onHome}>
            На старт
          </button>
        </div>
      </div>
    </motion.section>
  )
}
