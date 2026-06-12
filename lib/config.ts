export type FactionId = 'south' | 'east' | 'center' | 'west' | 'north'
export type CityId =
  | 'almaty' | 'shymkent' | 'astana' | 'karaganda'
  | 'aktau'  | 'atyrau'   | 'aktobe' | 'kostanay'
  | 'pavlodar' | 'taraz'

export interface CityConfig {
  x: number; y: number          // canvas 800×480 coordinates
  nameRu: string; nameKz: string
  faction: FactionId
  maxHp: number
}

export const CITIES: Record<CityId, CityConfig> = {
  almaty:    { x: 620, y: 370, nameRu: 'Алматы',    nameKz: 'Алматы',    faction: 'east',   maxHp: 1500 },
  shymkent:  { x: 490, y: 400, nameRu: 'Шымкент',   nameKz: 'Шымкент',   faction: 'south',  maxHp: 1200 },
  astana:    { x: 430, y: 180, nameRu: 'Астана',     nameKz: 'Астана',    faction: 'center', maxHp: 2000 },
  karaganda: { x: 390, y: 260, nameRu: 'Қарағанды',  nameKz: 'Қарағанды', faction: 'center', maxHp: 1100 },
  aktau:     { x: 110, y: 320, nameRu: 'Ақтау',      nameKz: 'Ақтау',     faction: 'west',   maxHp: 900  },
  atyrau:    { x: 170, y: 230, nameRu: 'Атырау',     nameKz: 'Атырау',    faction: 'west',   maxHp: 950  },
  aktobe:    { x: 235, y: 185, nameRu: 'Ақтөбе',     nameKz: 'Ақтөбе',    faction: 'west',   maxHp: 1000 },
  kostanay:  { x: 290, y: 105, nameRu: 'Қостанай',   nameKz: 'Қостанай',  faction: 'north',  maxHp: 1050 },
  pavlodar:  { x: 510, y: 115, nameRu: 'Павлодар',   nameKz: 'Павлодар',  faction: 'north',  maxHp: 1050 },
  taraz:     { x: 440, y: 390, nameRu: 'Тараз',      nameKz: 'Тараз',     faction: 'south',  maxHp: 1300 },
}

export interface FactionConfig {
  nameRu: string; nameKz: string
  color: string; darkColor: string
  cities: CityId[]
}

export const FACTIONS: Record<FactionId, FactionConfig> = {
  south:  { nameRu: 'Южная Орда',   nameKz: 'Оңтүстік Орда', color: '#F59E0B', darkColor: '#78350F', cities: ['shymkent','taraz'] },
  east:   { nameRu: 'Восточная Орда', nameKz: 'Шығыс Орда',  color: '#EF4444', darkColor: '#7F1D1D', cities: ['almaty'] },
  center: { nameRu: 'Центральная Орда', nameKz: 'Орталық Орда', color: '#3B82F6', darkColor: '#1E3A5F', cities: ['astana','karaganda'] },
  west:   { nameRu: 'Западная Орда',  nameKz: 'Батыс Орда',  color: '#10B981', darkColor: '#064E3B', cities: ['aktau','atyrau','aktobe'] },
  north:  { nameRu: 'Северная Орда',  nameKz: 'Солтүстік Орда', color: '#8B5CF6', darkColor: '#4C1D95', cities: ['kostanay','pavlodar'] },
}

export const CANVAS_W = 800
export const CANVAS_H = 480
export const MAX_CLICKS_PER_BATCH = 21
export const BATCH_INTERVAL_MS    = 3000
