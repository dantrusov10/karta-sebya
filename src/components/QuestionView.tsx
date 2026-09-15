import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Question, AnswerValue, QuestionOption } from '../types'
import { filterGroupedOptions, groupQuestionOptions } from '../lib/optionGroups'

interface Props {
  question: Question
  value: AnswerValue
  otherText: string
  onChange: (value: AnswerValue) => void
  onOtherText: (v: string) => void
  customChip: string
  onCustomChip: (v: string) => void
}

function OtherField({
  show,
  value,
  placeholder,
  onChange,
}: {
  show: boolean
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  if (!show) return null
  return (
    <motion.div
      className="other-inline"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      <textarea
        className="field"
        rows={2}
        value={value}
        placeholder={placeholder ?? 'Напиши своими словами…'}
        onChange={(e) => onChange(e.target.value)}
      />
    </motion.div>
  )
}

function OptionButton({
  opt,
  active,
  index,
  onToggle,
}: {
  opt: QuestionOption
  active: boolean
  index: number
  onToggle: () => void
}) {
  return (
    <motion.button
      key={opt.id}
      type="button"
      className={`option ${active ? 'active' : ''}`}
      onClick={onToggle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.25) }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="option-dot" />
      <span>{opt.label}</span>
    </motion.button>
  )
}

function MultiGrouped({
  question,
  selected,
  onToggle,
}: {
  question: Question
  selected: string[]
  onToggle: (id: string) => void
}) {
  const presets = question.options ?? []
  const [query, setQuery] = useState('')
  const [openExtra, setOpenExtra] = useState(false)

  const groups = useMemo(
    () => groupQuestionOptions(question.id, presets),
    [question.id, presets],
  )
  const filtered = useMemo(() => filterGroupedOptions(groups, query), [groups, query])

  const showSearch = presets.length >= 16
  const collapseFrom = groups.length > 2 ? 2 : groups.length > 1 ? 1 : 0
  const hasCollapsed = !query && collapseFrom > 0 && groups.length > collapseFrom

  const visible = filtered.filter((_, i) => {
    if (query || openExtra || !hasCollapsed) return true
    return i < collapseFrom
  })
  const hiddenCount = hasCollapsed && !openExtra && !query
    ? filtered.slice(collapseFrom).reduce((n, g) => n + g.options.length, 0)
    : 0

  return (
    <div className="multi-grouped">
      {showSearch && (
        <label className="option-search">
          <span className="sr-only">Найти в списке</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти в списке…"
            autoComplete="off"
          />
        </label>
      )}

      {visible.map((group) => (
        <div key={group.label || 'main'} className="option-group">
          {group.label ? <h3 className="option-group-title">{group.label}</h3> : null}
          <div className="options">
            {group.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                opt={opt}
                active={selected.includes(opt.id)}
                index={i}
                onToggle={() => onToggle(opt.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {hiddenCount > 0 && (
        <button
          type="button"
          className="btn soft small option-more"
          onClick={() => setOpenExtra(true)}
        >
          Ещё варианты · {hiddenCount}
        </button>
      )}

      {query && filtered.length === 0 && (
        <p className="hint-line">Ничего не нашлось — попробуй другие слова</p>
      )}
    </div>
  )
}

export function QuestionView({
  question,
  value,
  otherText,
  onChange,
  onOtherText,
  customChip,
  onCustomChip,
}: Props) {
  if (question.type === 'intro') {
    return (
      <motion.div
        className="intro-block"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="intro-lead">{question.subtitle}</p>
      </motion.div>
    )
  }

  if (question.type === 'surprise') {
    return (
      <motion.div
        className="surprise-block"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="surprise-emoji" aria-hidden>
          {question.surpriseEmoji ?? '✨'}
        </div>
        <p className="intro-lead">{question.subtitle}</p>
      </motion.div>
    )
  }

  if (question.type === 'single' && question.options) {
    const otherOn = !!question.allowOtherId && value === question.allowOtherId
    return (
      <div>
        <div className="options">
          {question.options.map((opt, i) => {
            const active = value === opt.id
            return (
              <motion.button
                key={opt.id}
                type="button"
                className={`option ${active ? 'active' : ''}`}
                onClick={() => onChange(opt.id)}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: active ? 1.015 : 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 320, damping: 22 }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="option-dot" />
                <span>{opt.label}</span>
              </motion.button>
            )
          })}
        </div>
        <OtherField
          show={otherOn}
          value={otherText}
          placeholder={question.otherPlaceholder}
          onChange={onOtherText}
        />
      </div>
    )
  }

  if (question.type === 'multi' || question.type === 'chips') {
    const selected = Array.isArray(value) ? value : []
    const presets = question.options ?? []
    const toggle = (id: string) => {
      if (selected.includes(id)) {
        onChange(selected.filter((x) => x !== id))
        return
      }
      if (question.maxSelect && selected.length >= question.maxSelect) return
      onChange([...selected, id])
    }

    const addCustom = () => {
      const t = customChip.trim()
      if (!t) return
      const id = `custom:${t}`
      if (!selected.includes(id)) {
        if (question.maxSelect && selected.length >= question.maxSelect) return
        onChange([...selected, id])
      }
      onCustomChip('')
    }

    const otherOn =
      !!question.allowOtherId && selected.includes(question.allowOtherId)

    return (
      <div>
        {question.type === 'multi' && presets.length >= 12 ? (
          <MultiGrouped question={question} selected={selected} onToggle={toggle} />
        ) : (
          <div className={question.type === 'chips' ? 'chips' : 'options'}>
            {presets.map((opt, i) => {
              const active = selected.includes(opt.id)
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  className={`${question.type === 'chips' ? 'chip' : 'option'} ${active ? 'active' : ''}`}
                  onClick={() => toggle(opt.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {question.type !== 'chips' && <span className="option-dot" />}
                  <span>{opt.label}</span>
                </motion.button>
              )
            })}
            {selected
              .filter((id) => id.startsWith('custom:'))
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${question.type === 'chips' ? 'chip' : 'option'} active`}
                  onClick={() => onChange(selected.filter((x) => x !== id))}
                >
                  {id.replace(/^custom:/, '')}
                </button>
              ))}
          </div>
        )}

        {question.type === 'multi' &&
          selected.filter((id) => id.startsWith('custom:')).map((id) => (
            <button
              key={id}
              type="button"
              className="option active"
              onClick={() => onChange(selected.filter((x) => x !== id))}
              style={{ marginTop: '0.5rem' }}
            >
              {id.replace(/^custom:/, '')}
            </button>
          ))}

        {question.type === 'chips' && (
          <div className="chip-add-wrap">
            {presets.length === 0 && selected.length === 0 && (
              <p className="empty-chips-hint">Пока пусто — начни с первой строки ниже</p>
            )}
            <div className="chip-add">
              <input
                value={customChip}
                onChange={(e) => onCustomChip(e.target.value)}
                placeholder="Название курса…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustom()
                  }
                }}
              />
              <button type="button" className="btn ghost" onClick={addCustom}>
                Добавить
              </button>
            </div>
            {question.addHint && <p className="hint-line">{question.addHint}</p>}
          </div>
        )}
        <OtherField
          show={otherOn}
          value={otherText}
          placeholder={question.otherPlaceholder}
          onChange={onOtherText}
        />
        {question.maxSelect && (
          <p className="hint-line sticky-pick-hint">
            Выбрано {selected.length}
            {question.maxSelect ? ` · можно до ${question.maxSelect}` : ''}
          </p>
        )}
      </div>
    )
  }

  if (question.type === 'scale') {
    const min = question.scaleMin ?? 1
    const max = question.scaleMax ?? 5
    const current = typeof value === 'number' ? value : null
    const items = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    return (
      <div className="scale">
        <div className="scale-labels">
          <span>{question.scaleLabels?.[0]}</span>
          <span>{question.scaleLabels?.[1]}</span>
        </div>
        <div className="scale-row">
          {items.map((n) => (
            <motion.button
              key={n}
              type="button"
              className={`scale-btn ${current === n ? 'active' : ''}`}
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.94 }}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'text') {
    return (
      <input
        className="field"
        value={typeof value === 'string' ? value : ''}
        placeholder={question.placeholder ?? 'Напиши своими словами…'}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (question.type === 'longtext') {
    return (
      <textarea
        className="field"
        value={typeof value === 'string' ? value : ''}
        placeholder={question.placeholder ?? 'Напиши своими словами…'}
        rows={question.rows ?? 4}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (question.type === 'rank' && question.options) {
    const order = Array.isArray(value) ? value : []
    const pick = (id: string) => {
      if (order.includes(id)) {
        onChange([])
        return
      }
      onChange([...order, id])
    }
    return (
      <div className="options">
        {question.options.map((opt) => {
          const idx = order.indexOf(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              className={`option rank ${idx >= 0 ? 'active' : ''}`}
              onClick={() => pick(opt.id)}
            >
              <span className="rank-num">{idx >= 0 ? idx + 1 : '·'}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
        {order.length > 0 && (
          <button type="button" className="btn ghost small" onClick={() => onChange([])}>
            Сбросить порядок
          </button>
        )}
      </div>
    )
  }

  return null
}
