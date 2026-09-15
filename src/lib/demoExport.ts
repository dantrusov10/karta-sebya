import { APP, DELIVERY } from '../config'
import { SESSIONS } from '../data/questions'
import type { InterviewExport } from '../types'

/** Минимальный демо-экспорт для проверки отправки в MAX без прохождения опроса */
export function buildDemoExport(): InterviewExport {
  return {
    meta: {
      title: `${APP.title} (тест кнопки)`,
      exportedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      progressPercent: 100,
      answeredCount: 1,
      totalQuestions: 1,
    },
    profileHints: {
      location: 'тест',
      remotePriority: 'тест',
      budget: 'тест',
      incomeGoals: 'тест',
      family: 'тест',
    },
    sessions: SESSIONS,
    answers: [
      {
        id: 'demo',
        session: 1,
        chapter: 'Тест',
        title: 'Это тестовая отправка кнопки MAX',
        type: 'text',
        answer: `Привет, ${DELIVERY.husbandName}. Если ты это читаешь — кнопка MAX работает.`,
      },
    ],
  }
}
