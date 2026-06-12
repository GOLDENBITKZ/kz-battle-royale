import type { CityId, FactionId } from './config'

export type ParticleType = 'traffic' | 'wind' | 'sparkle' | 'smoke' | 'wave' | 'snow' | 'dust' | 'oil' | 'crescent' | 'flower'

export interface CityTrait {
  cityId:       CityId
  personality:  string
  bonusHours:   [number, number]  // UTC start/end
  bonusType:    'atk' | 'def' | 'regen'
  bonusMult:    number
  defBonus:     number
  atkBonus:     number
  hpBonus:      number
  regenRate:    number
  unitSpeed:    number
  particleType: ParticleType
  description:  string
  funFact:      string
}

export const CITY_TRAITS: Record<CityId, CityTrait> = {
  almaty: {
    cityId: 'almaty', personality: 'Мегаполис',
    bonusHours: [7, 10], bonusType: 'def', bonusMult: 1.4,
    defBonus: 40, atkBonus: 0, hpBonus: 500, regenRate: 2,
    unitSpeed: 0.7, particleType: 'traffic',
    description: 'Пробки дают +40% защиту утром',
    funFact: 'В Алматы пробки начинаются в 7 утра и не заканчиваются никогда',
  },
  shymkent: {
    cityId: 'shymkent', personality: 'Мегаполис юга',
    bonusHours: [14, 18], bonusType: 'atk', bonusMult: 1.5,
    defBonus: 0, atkBonus: 50, hpBonus: 0, regenRate: 2,
    unitSpeed: 1.3, particleType: 'sparkle',
    description: 'Тои дают +50% атаку после обеда',
    funFact: 'Шымкентские той — это 3 дня гуляний и 500 гостей минимум',
  },
  astana: {
    cityId: 'astana', personality: 'Столица',
    bonusHours: [0, 23], bonusType: 'def', bonusMult: 1.15,
    defBonus: 15, atkBonus: 0, hpBonus: 0, regenRate: 3,
    unitSpeed: 1.0, particleType: 'wind',
    description: 'Байтерек даёт +15% защиту всегда',
    funFact: 'Астанаские ветра сдуют всё что не прикручено болтами',
  },
  karaganda: {
    cityId: 'karaganda', personality: 'Горняки',
    bonusHours: [6, 14], bonusType: 'atk', bonusMult: 1.3,
    defBonus: 0, atkBonus: 15, hpBonus: -100, regenRate: 1,
    unitSpeed: 1.2, particleType: 'dust',
    description: 'Шахтёры атакуют мощно, но HP пониже',
    funFact: 'Карагандинцы спрашивают «а ты знаешь почему» и сами отвечают',
  },
  aktau: {
    cityId: 'aktau', personality: 'Портовый',
    bonusHours: [20, 23], bonusType: 'regen', bonusMult: 1.5,
    defBonus: 0, atkBonus: 0, hpBonus: 0, regenRate: 5,
    unitSpeed: 0.8, particleType: 'wave',
    description: 'Морской бриз ночью регенерирует HP ×1.5',
    funFact: 'Актауцы измеряют расстояние микрорайонами, не километрами',
  },
  atyrau: {
    cityId: 'atyrau', personality: 'Нефтяной',
    bonusHours: [8, 20], bonusType: 'regen', bonusMult: 1.2,
    defBonus: 0, atkBonus: 0, hpBonus: 0, regenRate: 4,
    unitSpeed: 0.9, particleType: 'oil',
    description: 'Нефтяные доходы регенерируют HP постоянно',
    funFact: 'В Атырау Жайык и Урал — одна и та же река, просто с другой стороны',
  },
  aktobe: {
    cityId: 'aktobe', personality: 'Степной',
    bonusHours: [10, 16], bonusType: 'atk', bonusMult: 1.25,
    defBonus: 0, atkBonus: 10, hpBonus: 0, regenRate: 2,
    unitSpeed: 1.1, particleType: 'crescent',
    description: 'Степной ветер усиливает атаки днём',
    funFact: 'Актобе — Зенит-Баскет чемпионы, гордость Казахстана',
  },
  kostanay: {
    cityId: 'kostanay', personality: 'Хлебный',
    bonusHours: [9, 17], bonusType: 'def', bonusMult: 1.35,
    defBonus: 25, atkBonus: 0, hpBonus: 0, regenRate: 2,
    unitSpeed: 0.85, particleType: 'snow',
    description: 'Пшеничные поля дают +25% защиту днём',
    funFact: 'Костанайская пшеница кормит половину СНГ',
  },
  pavlodar: {
    cityId: 'pavlodar', personality: 'Индустриальный',
    bonusHours: [6, 18], bonusType: 'atk', bonusMult: 1.3,
    defBonus: 0, atkBonus: 20, hpBonus: 0, regenRate: 1,
    unitSpeed: 1.2, particleType: 'smoke',
    description: 'Заводы разгоняют атаку +20% рабочие часы',
    funFact: 'Павлодарский НПЗ — старейший в Казахстане',
  },
  taraz: {
    cityId: 'taraz', personality: 'Древний',
    bonusHours: [0, 23], bonusType: 'def', bonusMult: 1.0,
    defBonus: 35, atkBonus: 0, hpBonus: 0, regenRate: 3,
    unitSpeed: 0.75, particleType: 'flower',
    description: '2000 лет истории = самый защищённый город',
    funFact: 'Тараз основан в 1 веке н.э. — он видел больше войн чем все остальные вместе',
  },
}

export function getTimeBonus(trait: CityTrait): number {
  const h = new Date().getUTCHours()
  const [start, end] = trait.bonusHours
  if (start <= end ? (h >= start && h < end) : (h >= start || h < end)) {
    return trait.bonusMult
  }
  return 1.0
}
