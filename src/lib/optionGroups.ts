import type { QuestionOption } from '../types'

export type OptionGroup = { label: string; options: QuestionOption[] }

const INTEREST_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'С людьми',
    ids: [
      'help_calm',
      'help_urgent',
      'heal_care',
      'teach',
      'listen',
      'negotiate',
      'lead_soft',
    ],
  },
  {
    label: 'Руки и место',
    ids: ['make_beauty', 'shape_space', 'grow_living', 'craft', 'express'],
  },
  {
    label: 'Порядок',
    ids: [
      'keep_order',
      'count',
      'move_flow',
      'hunt_best',
      'investigate',
      'backstage',
      'own_story',
      'unknown',
    ],
  },
]

const PULL_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Люди',
    ids: ['help_people', 'body_health', 'protect_safe', 'teach_guide', 'listen_psy'],
  },
  {
    label: 'Дело',
    ids: [
      'beauty_space',
      'living_nature',
      'hands_craft',
      'systems_order',
      'numbers_docs',
      'create_express',
      'own_path',
      'unsure',
    ],
  },
]

const CURIOSITY_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Человек',
    ids: ['human_body', 'care_help', 'crisis_safety', 'psyche', 'teach_learn', 'kids_dev'],
  },
  {
    label: 'Мир и дело',
    ids: [
      'nature_living',
      'food_sensory',
      'space_form',
      'materials',
      'numbers',
      'words',
      'visual',
      'tech_light',
      'own_biz',
      'surprise',
    ],
  },
]

function packByIdLists(
  options: QuestionOption[],
  groups: { label: string; ids: string[] }[],
  fallbackLabel = 'Ещё',
): OptionGroup[] {
  const byId = new Map(options.map((o) => [o.id, o]))
  const used = new Set<string>()
  const out: OptionGroup[] = []
  for (const g of groups) {
    const opts = g.ids.map((id) => byId.get(id)).filter(Boolean) as QuestionOption[]
    opts.forEach((o) => used.add(o.id))
    if (opts.length) out.push({ label: g.label, options: opts })
  }
  const rest = options.filter((o) => !used.has(o.id))
  if (rest.length) out.push({ label: fallbackLabel, options: rest })
  return out
}

export function groupQuestionOptions(
  questionId: string,
  options: QuestionOption[],
): OptionGroup[] {
  if (options.length < 12) {
    return [{ label: '', options }]
  }

  if (questionId === 's2_interest_clusters') {
    return packByIdLists(options, INTEREST_GROUPS)
  }

  if (questionId === 's3_segment_pull') {
    return packByIdLists(options, PULL_GROUPS)
  }

  if (questionId === 's3_curiosity_themes') {
    return packByIdLists(options, CURIOSITY_GROUPS)
  }

  if (questionId === 's1_fuel_bits' || questionId === 's2_strengths_self') {
    const mid = Math.ceil(options.length / 2)
    return [
      { label: '', options: options.slice(0, mid) },
      { label: '', options: options.slice(mid) },
    ].filter((g) => g.options.length > 0)
  }

  return [{ label: '', options }]
}

export function filterGroupedOptions(
  groups: OptionGroup[],
  query: string,
): OptionGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups
    .map((g) => ({
      ...g,
      options: g.options.filter(
        (o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.options.length > 0)
}
