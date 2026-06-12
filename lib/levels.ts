export interface LevelConfig {
  level: number; title: string; titleKz: string
  xpRequired: number; icon: string; color: string
}

export const LEVELS: LevelConfig[] = [
  { level:  1, title: 'Новобранец',  titleKz: 'Жаңадан',    xpRequired: 0,     icon: '🪖', color: '#9CA3AF' },
  { level:  2, title: 'Боец',        titleKz: 'Жауынгер',   xpRequired: 100,   icon: '⚔️', color: '#6B7280' },
  { level:  3, title: 'Сардар',      titleKz: 'Сардар',     xpRequired: 300,   icon: '🗡️', color: '#F59E0B' },
  { level:  4, title: 'Батыр',       titleKz: 'Батыр',      xpRequired: 600,   icon: '🛡️', color: '#F97316' },
  { level:  5, title: 'Хан',         titleKz: 'Хан',        xpRequired: 1200,  icon: '👑', color: '#EF4444' },
  { level:  6, title: 'Бий',         titleKz: 'Би',         xpRequired: 2500,  icon: '⚡', color: '#8B5CF6' },
  { level:  7, title: 'Аруах',       titleKz: 'Аруақ',      xpRequired: 5000,  icon: '🔥', color: '#EC4899' },
  { level:  8, title: 'Ер-батыр',    titleKz: 'Ер батыр',   xpRequired: 10000, icon: '🌟', color: '#06B6D4' },
  { level:  9, title: 'Жеңімпаз',    titleKz: 'Жеңімпаз',   xpRequired: 25000, icon: '💎', color: '#10B981' },
  { level: 10, title: 'Шыңғыс',      titleKz: 'Шыңғыс',     xpRequired: 50000, icon: '🏆', color: '#FFD700' },
]

export function getLevelConfig(level: number): LevelConfig {
  return LEVELS[Math.min(Math.max(level, 1), 10) - 1]
}

export function getXpProgress(xp: number): { pct: number; current: number; needed: number; level: number } {
  let level = 1
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) { level = LEVELS[i].level; break }
  }
  const cfg  = LEVELS[level - 1]
  const next = LEVELS[level] ?? null
  const current = xp - cfg.xpRequired
  const needed  = next ? next.xpRequired - cfg.xpRequired : 1
  return { pct: next ? Math.min((current / needed) * 100, 100) : 100, current, needed, level }
}
