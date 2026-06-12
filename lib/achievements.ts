export interface Achievement {
  id:          string
  nameRu:      string
  icon:        string
  description: string
  check:       (stats: AchievementStats) => boolean
}

export interface AchievementStats {
  totalClicks:    number
  citiesCaptured: number
  maxCombo:       number
  streak:         number
  abilitiesUsed:  number
  questsDone:     number
  referrals:      number
  level:          number
  faction:        string
  dailyClicks:    number
  daysActive:     number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_click',    nameRu: 'Первый удар',      icon: '👊', description: 'Первый клик',              check: s => s.totalClicks >= 1 },
  { id: 'hundred',        nameRu: 'Сотник',            icon: '💯', description: '100 кликов',               check: s => s.totalClicks >= 100 },
  { id: 'thousand',       nameRu: 'Тысячник',          icon: '🔥', description: '1 000 кликов',             check: s => s.totalClicks >= 1000 },
  { id: 'ten_thousand',   nameRu: 'Батыр кликов',      icon: '⚔️', description: '10 000 кликов',            check: s => s.totalClicks >= 10000 },
  { id: 'conquerer',      nameRu: 'Завоеватель',       icon: '🏰', description: 'Захвати 1 город',          check: s => s.citiesCaptured >= 1 },
  { id: 'warlord',        nameRu: 'Военачальник',      icon: '👑', description: 'Захвати 5 городов',        check: s => s.citiesCaptured >= 5 },
  { id: 'combo10',        nameRu: 'Комбо-мастер',      icon: '⚡', description: 'Комбо ×10',                check: s => s.maxCombo >= 10 },
  { id: 'combo30',        nameRu: 'Шаман кликов',      icon: '🌀', description: 'Комбо ×30',                check: s => s.maxCombo >= 30 },
  { id: 'streak7',        nameRu: 'Стальная воля',     icon: '📅', description: '7 дней подряд',            check: s => s.streak >= 7 },
  { id: 'streak30',       nameRu: 'Легенда',           icon: '🏆', description: '30 дней подряд',           check: s => s.streak >= 30 },
  { id: 'ability5',       nameRu: 'Маг способностей',  icon: '✨', description: '5 способностей',           check: s => s.abilitiesUsed >= 5 },
  { id: 'quests10',       nameRu: 'Выполнил долг',     icon: '📜', description: '10 ежедневных квестов',    check: s => s.questsDone >= 10 },
  { id: 'referral',       nameRu: 'Вербовщик',         icon: '🤝', description: 'Привёл 1 игрока',          check: s => s.referrals >= 1 },
  { id: 'level5',         nameRu: 'Хан',               icon: '🛡️', description: 'Достиг уровня 5',          check: s => s.level >= 5 },
  { id: 'level10',        nameRu: 'Шыңғыс',            icon: '💎', description: 'Достиг уровня 10',         check: s => s.level >= 10 },
  { id: 'daily1000',      nameRu: 'Рабочий день',      icon: '💪', description: '1000 кликов за день',      check: s => s.dailyClicks >= 1000 },
]
