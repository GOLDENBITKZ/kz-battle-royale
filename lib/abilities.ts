import type { FactionId } from './config'

export type AbilityEffect = 'multiplier' | 'shield' | 'mass' | 'restore' | 'freeze'

export interface AbilityConfig {
  id:          string
  nameRu:      string
  nameKz:      string
  icon:        string
  cooldown:    number   // seconds
  duration:    number   // seconds (0 = instant)
  xpCost:      number
  unlockLevel: number
  factions:    FactionId[]
  effectType:  AbilityEffect
  effectValue: number
  description: string
}

export const ABILITIES: AbilityConfig[] = [
  {
    id: 'fury', nameRu: 'Ярость', nameKz: 'Ашулану', icon: '⚡',
    cooldown: 180, duration: 15, xpCost: 50, unlockLevel: 3,
    factions: ['south','east','center','west','north'],
    effectType: 'multiplier', effectValue: 2.0,
    description: '×2 урон 15 сек',
  },
  // South
  {
    id: 'toi_bomb', nameRu: 'Той-бомба', nameKz: 'Той бомба', icon: '🎊',
    cooldown: 300, duration: 20, xpCost: 120, unlockLevel: 4,
    factions: ['south'],
    effectType: 'multiplier', effectValue: 3.0,
    description: '×3 урон 20 сек — Шымкентский той врагу',
  },
  {
    id: 'batyr_rage', nameRu: 'Ярость батыра', nameKz: 'Батыр ашуы', icon: '🗡️',
    cooldown: 600, duration: 8, xpCost: 250, unlockLevel: 8,
    factions: ['south'],
    effectType: 'multiplier', effectValue: 5.0,
    description: '×5 урон 8 сек — легендарная атака',
  },
  // East
  {
    id: 'almaty_jam', nameRu: 'Алматы-пробка', nameKz: 'Алматы кептелісі', icon: '🚗',
    cooldown: 300, duration: 20, xpCost: 100, unlockLevel: 4,
    factions: ['east'],
    effectType: 'shield', effectValue: 1.5,
    description: 'Пробки создают щит для города',
  },
  {
    id: 'mountain_eagle', nameRu: 'Горный беркут', nameKz: 'Тау бүркіті', icon: '🦅',
    cooldown: 900, duration: 0, xpCost: 350, unlockLevel: 9,
    factions: ['east'],
    effectType: 'mass', effectValue: 500,
    description: 'Мгновенный удар на 500 HP',
  },
  // Center
  {
    id: 'steppe_wind', nameRu: 'Астанинский ветер', nameKz: 'Астана желі', icon: '💨',
    cooldown: 180, duration: 30, xpCost: 60, unlockLevel: 3,
    factions: ['center'],
    effectType: 'multiplier', effectValue: 1.5,
    description: '×1.5 урон 30 сек от ветра',
  },
  {
    id: 'baiterek', nameRu: 'Байтерек', nameKz: 'Байтерек', icon: '🏙️',
    cooldown: 600, duration: 0, xpCost: 300, unlockLevel: 9,
    factions: ['center'],
    effectType: 'restore', effectValue: 0.4,
    description: 'Восстанавливает 40% HP столицы',
  },
  // West
  {
    id: 'oil_storm', nameRu: 'Нефтяной шторм', nameKz: 'Мұнай дауылы', icon: '🛢️',
    cooldown: 300, duration: 25, xpCost: 90, unlockLevel: 4,
    factions: ['west'],
    effectType: 'freeze', effectValue: 0.5,
    description: 'Враги атакуют вдвое медленнее 25 сек',
  },
  {
    id: 'caspian_wave', nameRu: 'Каспийская волна', nameKz: 'Каспий толқыны', icon: '🌊',
    cooldown: 480, duration: 10, xpCost: 180, unlockLevel: 7,
    factions: ['west'],
    effectType: 'mass', effectValue: 2.0,
    description: 'Двойной масс-удар волной',
  },
  // North
  {
    id: 'siberian_frost', nameRu: 'Сибирский мороз', nameKz: 'Сібір аязы', icon: '❄️',
    cooldown: 300, duration: 25, xpCost: 100, unlockLevel: 4,
    factions: ['north'],
    effectType: 'freeze', effectValue: 0.5,
    description: 'Заморозка атак врага на 25 сек',
  },
  {
    id: 'wheat_shield', nameRu: 'Пшеничный щит', nameKz: 'Бидай қалқаны', icon: '🌾',
    cooldown: 720, duration: 60, xpCost: 400, unlockLevel: 10,
    factions: ['north'],
    effectType: 'shield', effectValue: 2.0,
    description: 'Сверхщит ×2 на целую минуту',
  },
]

export function getAvailableAbilities(faction: FactionId, level: number): AbilityConfig[] {
  return ABILITIES.filter(a => a.factions.includes(faction) && a.unlockLevel <= level)
}
