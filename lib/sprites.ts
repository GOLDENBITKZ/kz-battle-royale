import type { CityId, FactionId } from './config'
import { FACTIONS } from './config'

type Ctx = CanvasRenderingContext2D

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h)
}

export function drawAlmaty(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Mountains
  ctx.fillStyle = '#374151'
  ctx.beginPath(); ctx.moveTo(x-u*4, y); ctx.lineTo(x-u*2, y-u*4); ctx.lineTo(x, y); ctx.fill()
  ctx.beginPath(); ctx.moveTo(x-u, y); ctx.lineTo(x+u*2, y-u*5); ctx.lineTo(x+u*5, y); ctx.fill()
  // Snow peaks
  ctx.fillStyle = '#F9FAFB'
  ctx.beginPath(); ctx.moveTo(x-u*2.3, y-u*3.5); ctx.lineTo(x-u*2, y-u*4); ctx.lineTo(x-u*1.7, y-u*3.5); ctx.fill()
  ctx.beginPath(); ctx.moveTo(x+u*1.6, y-u*4.5); ctx.lineTo(x+u*2, y-u*5); ctx.lineTo(x+u*2.4, y-u*4.5); ctx.fill()
  // Skyscrapers
  px(ctx, x-u*0.5, y-u*3, u, u*3, c)
  px(ctx, x+u, y-u*2.5, u, u*2.5, FACTIONS[faction].darkColor)
  px(ctx, x-u*2, y-u*2, u, u*2, c)
  // Windows
  ctx.fillStyle = '#FEF3C7'
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++)
    px(ctx, x-u*0.3 + col*u*0.4, y-u*2.8 + row*u*0.8, u*0.2, u*0.5, '#FEF3C7')
}

export function drawAstana(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Baiterek stem
  px(ctx, x-u*0.3, y-u*4, u*0.6, u*4, '#D1D5DB')
  // Sphere
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x, y-u*4.5, u*1.2, 0, Math.PI*2); ctx.fill()
  // Gold center
  ctx.fillStyle = '#FFD700'
  ctx.beginPath(); ctx.arc(x, y-u*4.5, u*0.5, 0, Math.PI*2); ctx.fill()
  // Base trifoil
  ctx.fillStyle = '#6B7280'
  for (let i = 0; i < 3; i++) {
    const a = (i/3)*Math.PI*2 - Math.PI/2
    ctx.beginPath(); ctx.arc(x + Math.cos(a)*u, y-u + Math.sin(a)*u, u*0.6, 0, Math.PI*2); ctx.fill()
  }
  // Khan Shatyr
  ctx.fillStyle = FACTIONS[faction].darkColor
  ctx.beginPath(); ctx.moveTo(x+u*2, y); ctx.lineTo(x+u*3.5, y-u*3); ctx.lineTo(x+u*5, y); ctx.fill()
  ctx.fillStyle = c+'88'
  ctx.beginPath(); ctx.moveTo(x+u*2.2, y-u*0.2); ctx.lineTo(x+u*3.5, y-u*2.7); ctx.lineTo(x+u*4.8, y-u*0.2); ctx.fill()
}

export function drawShymkent(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Main dome
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x, y-u*2, u*1.5, Math.PI, 0); ctx.fill()
  // Crescent on dome
  ctx.fillStyle = '#0A0A0F'
  ctx.beginPath(); ctx.arc(x+u*0.3, y-u*2.2, u*0.8, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x+u*0.6, y-u*2.2, u*0.65, 0, Math.PI*2); ctx.fill()
  // Side minarets
  px(ctx, x-u*2, y-u*3.5, u*0.4, u*3.5, '#9CA3AF')
  px(ctx, x+u*1.6, y-u*3.5, u*0.4, u*3.5, '#9CA3AF')
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x-u*1.8, y-u*3.5, u*0.35, Math.PI, 0); ctx.fill()
  ctx.beginPath(); ctx.arc(x+u*1.8, y-u*3.5, u*0.35, Math.PI, 0); ctx.fill()
  // Side domes
  ctx.fillStyle = FACTIONS[faction].darkColor
  ctx.beginPath(); ctx.arc(x-u*2.5, y-u*1.5, u, Math.PI, 0); ctx.fill()
  ctx.beginPath(); ctx.arc(x+u*2.5, y-u*1.5, u, Math.PI, 0); ctx.fill()
}

export function drawKaraganda(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Waste hills
  ctx.fillStyle = '#374151'
  ctx.beginPath(); ctx.arc(x-u*3, y, u*1.5, Math.PI, 0); ctx.fill()
  ctx.beginPath(); ctx.arc(x-u*5, y, u, Math.PI, 0); ctx.fill()
  // Headframe legs
  ctx.strokeStyle = c; ctx.lineWidth = u*0.4
  ctx.beginPath(); ctx.moveTo(x-u*1.2, y); ctx.lineTo(x, y-u*4); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x+u*1.2, y); ctx.lineTo(x, y-u*4); ctx.stroke()
  // Pulley
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x, y-u*4, u*0.6, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = '#0A0A0F'
  ctx.beginPath(); ctx.arc(x, y-u*4, u*0.3, 0, Math.PI*2); ctx.fill()
  // Factory
  px(ctx, x+u*2, y-u*2, u*2, u*2, '#374151')
  px(ctx, x+u*2.5, y-u*3.5, u*0.5, u*1.5, '#4B5563')
}

export function drawAktau(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Sea
  ctx.fillStyle = '#1E3A5F'
  ctx.fillRect(x-u*5, y-u*0.5, u*10, u)
  // Lighthouse
  ctx.fillStyle = '#F9FAFB'
  px(ctx, x-u*0.4, y-u*4.5, u*0.8, u*4.5, '#F9FAFB')
  // Stripes
  px(ctx, x-u*0.4, y-u*3.5, u*0.8, u*0.5, c)
  px(ctx, x-u*0.4, y-u*2, u*0.8, u*0.5, c)
  // Lantern
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x, y-u*4.8, u*0.6, 0, Math.PI*2); ctx.fill()
  // Light beam
  ctx.strokeStyle = c+'44'; ctx.lineWidth = u*0.8
  ctx.setLineDash([u, u*0.5])
  ctx.beginPath(); ctx.moveTo(x+u*0.4, y-u*4.8); ctx.lineTo(x+u*4, y-u*2); ctx.stroke()
  ctx.setLineDash([])
  // Oil platform
  px(ctx, x+u*3, y-u*1.5, u*2, u*0.3, '#9CA3AF')
  px(ctx, x+u*3.2, y-u*2.5, u*0.3, u, '#6B7280')
  px(ctx, x+u*4.2, y-u*2.5, u*0.3, u, '#6B7280')
}

export function drawAtyrau(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // River
  ctx.fillStyle = '#1E3A5F'
  ctx.fillRect(x-u*4, y-u*0.8, u*8, u*1.2)
  // Bridge deck
  px(ctx, x-u*3.5, y-u*1, u*7, u*0.3, '#9CA3AF')
  // Cable-stayed pylons
  ctx.strokeStyle = c; ctx.lineWidth = u*0.2
  px(ctx, x-u*0.2, y-u*3.5, u*0.4, u*3, '#9CA3AF')
  const cables = [-3.5, -2.5, -1.5, 1.5, 2.5, 3.5]
  cables.forEach(dx => {
    ctx.beginPath(); ctx.moveTo(x, y-u*3.5); ctx.lineTo(x+dx*u, y-u*1); ctx.stroke()
  })
  // Buildings
  px(ctx, x-u*5, y-u*2.5, u*1.2, u*2.5, FACTIONS[faction].darkColor)
  px(ctx, x+u*3.8, y-u*2, u, u*2, FACTIONS[faction].darkColor)
  px(ctx, x+u*5, y-u*3, u*0.8, u*3, c)
}

export function drawAktobe(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Mosque domes
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = i === 0 ? c : FACTIONS[faction].darkColor
    ctx.beginPath(); ctx.arc(x + i*u*2, y-u*2, i === 0 ? u*1.2 : u*0.9, Math.PI, 0); ctx.fill()
  }
  // Crescent on center dome
  ctx.fillStyle = '#FFD700'
  ctx.beginPath(); ctx.arc(x+u*0.3, y-u*3.4, u*0.4, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x+u*0.6, y-u*3.4, u*0.32, 0, Math.PI*2); ctx.fill()
  // Modern tower
  px(ctx, x+u*3, y-u*4, u*0.8, u*4, '#4B5563')
  ctx.fillStyle = '#60A5FA'
  for (let r = 0; r < 4; r++)
    px(ctx, x+u*3.1, y-u*3.7 + r*u*0.8, u*0.6, u*0.4, '#60A5FA')
}

export function drawKostanay(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Silos
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#D1D5DB' : '#9CA3AF'
    ctx.beginPath(); ctx.arc(x-u*3 + i*u*1.5, y-u, u*0.6, Math.PI, 0); ctx.fill()
    px(ctx, x-u*3.6 + i*u*1.5, y-u, u*1.2, u, i % 2 === 0 ? '#D1D5DB' : '#9CA3AF')
  }
  // Wheat stalks
  ctx.strokeStyle = c; ctx.lineWidth = u*0.15
  for (let i = 0; i < 8; i++) {
    const sx = x - u*4 + i * u*1.1
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y-u*1.5); ctx.stroke()
    ctx.beginPath(); ctx.arc(sx, y-u*1.5, u*0.3, -Math.PI*0.7, -Math.PI*0.3); ctx.stroke()
    ctx.beginPath(); ctx.arc(sx, y-u*1.5, u*0.3, -Math.PI*0.7, -Math.PI*0.3, true); ctx.stroke()
  }
}

export function drawPavlodar(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Factory building
  px(ctx, x-u*2, y-u*2, u*4, u*2, '#374151')
  // Chimneys
  for (let i = 0; i < 4; i++) {
    px(ctx, x-u*1.8 + i*u*1.2, y-u*4, u*0.5, u*2, '#4B5563')
    // Red stripes
    px(ctx, x-u*1.8 + i*u*1.2, y-u*3.3, u*0.5, u*0.2, '#EF4444')
    px(ctx, x-u*1.8 + i*u*1.2, y-u*3.8, u*0.5, u*0.2, '#EF4444')
  }
  // Rail tracks
  ctx.strokeStyle = c; ctx.lineWidth = u*0.15
  ctx.setLineDash([u*0.5, u*0.3])
  ctx.beginPath(); ctx.moveTo(x-u*4, y); ctx.lineTo(x+u*4, y); ctx.stroke()
  ctx.setLineDash([])
  // Windows
  ctx.fillStyle = c+'88'
  for (let i = 0; i < 3; i++)
    px(ctx, x-u*1.5 + i*u*1.3, y-u*1.6, u*0.8, u*0.6, c+'88')
}

export function drawTaraz(ctx: Ctx, x: number, y: number, u: number, faction: FactionId) {
  const c = FACTIONS[faction].color
  // Outer wall
  ctx.strokeStyle = c; ctx.lineWidth = u*0.4
  ctx.strokeRect(x-u*3, y-u*2, u*6, u*2)
  // Crenellations
  ctx.fillStyle = c
  for (let i = 0; i < 7; i++)
    px(ctx, x-u*3 + i*u*0.9, y-u*2.4, u*0.5, u*0.4, c)
  // Corner towers
  for (const dx of [-3, 2.5]) {
    ctx.fillStyle = FACTIONS[faction].darkColor
    px(ctx, x+dx*u, y-u*3.5, u*0.8, u*3.5, FACTIONS[faction].darkColor)
    // Arrow slits
    px(ctx, x+dx*u+u*0.15, y-u*2.5, u*0.15, u*0.5, '#0A0A0F')
    px(ctx, x+dx*u+u*0.5, y-u*2.5, u*0.15, u*0.5, '#0A0A0F')
  }
  // Gateway arch
  ctx.fillStyle = '#0A0A0F'
  ctx.beginPath(); ctx.arc(x, y-u*0.8, u*0.7, Math.PI, 0); ctx.fill()
  px(ctx, x-u*0.7, y-u*0.8, u*1.4, u*0.8, '#0A0A0F')
  // Inner dome
  ctx.fillStyle = c
  ctx.beginPath(); ctx.arc(x, y-u*2.5, u*0.8, Math.PI, 0); ctx.fill()
}

const DRAWERS: Record<CityId, (ctx: Ctx, x: number, y: number, u: number, f: FactionId) => void> = {
  almaty:    drawAlmaty,
  shymkent:  drawShymkent,
  astana:    drawAstana,
  karaganda: drawKaraganda,
  aktau:     drawAktau,
  atyrau:    drawAtyrau,
  aktobe:    drawAktobe,
  kostanay:  drawKostanay,
  pavlodar:  drawPavlodar,
  taraz:     drawTaraz,
}

export function drawCitySprite(
  ctx: Ctx, cityId: CityId, x: number, y: number, unitSize: number, faction: FactionId
) {
  ctx.save()
  ctx.translate(x, y)
  DRAWERS[cityId]?.(ctx, 0, 0, unitSize, faction)
  ctx.restore()
}
