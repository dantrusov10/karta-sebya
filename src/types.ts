export type QuestionType =
  | 'intro'
  | 'single'
  | 'multi'
  | 'scale'
  | 'text'
  | 'longtext'
  | 'chips'
  | 'rank'
  | 'surprise'

export type AnswerValue =
  | string
  | string[]
  | number
  | null
  | undefined

export interface QuestionOption {
  id: string
  label: string
  hint?: string
}

export interface Question {
  id: string
  session: 1 | 2 | 3
  chapter: string
  type: QuestionType
  title: string
  subtitle?: string
  required?: boolean
  options?: QuestionOption[]
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: [string, string]
  maxSelect?: number
  placeholder?: string
  rows?: number
  /** Показать поле «своими словами», если выбран option id */
  allowOtherId?: string
  otherPlaceholder?: string
  /** Для chips: инструкция под полем добавления */
  addHint?: string
  surpriseEmoji?: string
}

export interface SessionMeta {
  id: 1 | 2 | 3
  title: string
  subtitle: string
  duration: string
}

export interface InterviewState {
  version: number
  startedAt: string
  updatedAt: string
  completedAt: string | null
  currentIndex: number
  answers: Record<string, AnswerValue>
  /** Ответы к «другое» рядом с multi/single */
  otherTexts: Record<string, string>
  sessionBreakSeen: number[]
  /** Сколько личных посланий уже показали */
  loveNotesShown: number
}

export interface InterviewExport {
  meta: {
    title: string
    exportedAt: string
    startedAt: string
    completedAt: string | null
    progressPercent: number
    answeredCount: number
    totalQuestions: number
  }
  profileHints: {
    location: string
    remotePriority: string
    budget: string
    incomeGoals: string
    family: string
  }
  sessions: SessionMeta[]
  answers: Array<{
    id: string
    session: number
    chapter: string
    title: string
    type: QuestionType
    answer: AnswerValue
    otherText?: string
  }>
}
