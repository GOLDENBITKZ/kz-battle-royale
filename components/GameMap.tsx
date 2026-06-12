'use client'
import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { CITIES, FACTIONS, CANVAS_W, CANVAS_H, type CityId, type FactionId } from '@/lib/config'
import { CITY_TRAITS } from '@/lib/city-traits'
import { drawCitySprite } from '@/lib/sprites'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3.5
const MINIMAP_W = 90
const MINIMAP_H = 54

export interface CityState {
  cityId: string; owner: string; hp: number; maxHp: number; score: number
}
export interface GameStateUpdate { cities: CityState[] }

export interface GameMapHandle {
  applyUpdate:   (u: GameStateUpdate) => void
  flashCapture:  (cityId: CityId, newOwner: FactionId) => void
}

interface AttackUnit {
  id: string; fromCity: CityId; toCity: CityId
  x: number; y: number; progress: number
  faction: FactionId; drift: number; wave: number
  trail: Array<{ x: number; y: number }>
}

interface Particle {
  id: number; type: string
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number
}

interface Props {
  userFaction:    FactionId
  userCityId:     CityId
  onCityClick:    (id: CityId) => void
  onCityDblTap:   (id: CityId) => void
  selectedTarget: CityId | null
}

let uid = 0

export default forwardRef<GameMapHandle, Props>(function GameMap(
  { userFaction, userCityId, onCityClick, onCityDblTap, selectedTarget }, ref
) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const vpRef      = useRef({ panX: CANVAS_W / 2, panY: CANVAS_H / 2, zoom: 1 })
  const stateRef   = useRef<Map<CityId, CityState>>(new Map())
  const unitsRef   = useRef<AttackUnit[]>([])
  const particlesRef = useRef<Particle[]>([])
  const flashRef   = useRef<Map<CityId, { frame: number; color: string }>>(new Map())
  const frameRef   = useRef(0)
  const rafRef     = useRef<number>(0)
  const lastTap    = useRef<{ city: CityId; time: number } | null>(null)
  const touchRef   = useRef<{ x: number; y: number; startX: number; startY: number; dist?: number } | null>(null)
  const particleIdRef = useRef(0)

  // Expose handle
  useImperativeHandle(ref, () => ({
    applyUpdate(u: GameStateUpdate) {
      u.cities.forEach(cs => stateRef.current.set(cs.cityId as CityId, cs))
    },
    flashCapture(cityId, newOwner) {
      flashRef.current.set(cityId, { frame: 0, color: FACTIONS[newOwner].color })
    },
  }))

  // Coordinate transform
  const toScreen = useCallback((wx: number, wy: number) => {
    const { panX, panY, zoom } = vpRef.current
    const cw = canvasRef.current?.width  ?? CANVAS_W
    const ch = canvasRef.current?.height ?? CANVAS_H
    return {
      sx: (wx - panX) * zoom + cw / 2,
      sy: (wy - panY) * zoom + ch / 2,
    }
  }, [])

  const toWorld = useCallback((sx: number, sy: number) => {
    const { panX, panY, zoom } = vpRef.current
    const cw = canvasRef.current?.width  ?? CANVAS_W
    const ch = canvasRef.current?.height ?? CANVAS_H
    return {
      wx: (sx - cw / 2) / zoom + panX,
      wy: (sy - ch / 2) / zoom + panY,
    }
  }, [])

  const findCityAt = useCallback((wx: number, wy: number): CityId | null => {
    const hitR = Math.max(20, 28 / vpRef.current.zoom)
    let best: CityId | null = null, bestD = Infinity
    for (const [id, cfg] of Object.entries(CITIES)) {
      const d = Math.hypot(cfg.x - wx, cfg.y - wy)
      if (d < hitR && d < bestD) { best = id as CityId; bestD = d }
    }
    return best
  }, [])

  // Emit particles
  const emitParticle = useCallback((cityId: CityId) => {
    const cfg   = CITIES[cityId]
    const trait = CITY_TRAITS[cityId]
    const t     = trait.particleType
    const p: Particle = {
      id: particleIdRef.current++, type: t,
      x: cfg.x + (Math.random() - 0.5) * 20,
      y: cfg.y + (Math.random() - 0.5) * 10,
      vx: 0, vy: 0, life: 1, maxLife: 1,
      color: '#fff', size: 2,
    }
    switch (t) {
      case 'traffic':  p.vx = (Math.random() - 0.5) * 3; p.vy = 0; p.color = '#EF4444'; p.size = 2; p.maxLife = 60; break
      case 'wind':     p.vx = Math.random() * 3 + 1; p.vy = (Math.random() - 0.5); p.color = '#BAE6FD'; p.size = 1.5; p.maxLife = 50; break
      case 'sparkle':  p.vx = (Math.random() - 0.5) * 2; p.vy = -Math.random() * 2; p.color = '#FDE68A'; p.size = 3; p.maxLife = 40; break
      case 'smoke':    p.vx = (Math.random() - 0.5); p.vy = -Math.random() * 1.5 - 0.5; p.color = '#6B7280'; p.size = 4; p.maxLife = 80; break
      case 'wave':     p.vx = (Math.random() - 0.5) * 2; p.vy = -Math.random(); p.color = '#38BDF8'; p.size = 2.5; p.maxLife = 45; break
      case 'snow':     p.vx = (Math.random() - 0.5); p.vy = Math.random() * 0.8 + 0.2; p.color = '#F0F9FF'; p.size = 2; p.maxLife = 100; break
      case 'dust':     p.vx = Math.random() * 2; p.vy = (Math.random() - 0.5); p.color = '#D97706'; p.size = 2; p.maxLife = 55; break
      case 'oil':      p.vx = 0; p.vy = Math.random() * 0.5; p.color = '#1C1917'; p.size = 3; p.maxLife = 60; break
      case 'crescent': p.vx = (Math.random() - 0.5); p.vy = -Math.random(); p.color = '#FBBF24'; p.size = 2; p.maxLife = 50; break
      case 'flower':   p.vx = (Math.random() - 0.5) * 1.5; p.vy = -Math.random() * 0.8; p.color = '#F9A8D4'; p.size = 3; p.maxLife = 70; break
    }
    p.life = p.maxLife
    particlesRef.current.push(p)
    if (particlesRef.current.length > 300) particlesRef.current.splice(0, 50)
  }, [])

  // Spawn attack unit
  const spawnUnit = useCallback((from: CityId, to: CityId, faction: FactionId) => {
    const f = CITIES[from]; const t = CITIES[to]
    unitsRef.current.push({
      id: `u${uid++}`, fromCity: from, toCity: to,
      x: f.x, y: f.y, progress: 0,
      faction, drift: (Math.random() - 0.5) * 0.3,
      wave: Math.random() * Math.PI * 2,
      trail: [],
    })
  }, [])

  // Resize canvas to container
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Fit world inside canvas on mobile
      const scaleX = canvas.width  / CANVAS_W
      const scaleY = canvas.height / CANVAS_H
      vpRef.current.zoom = Math.min(scaleX, scaleY) * 0.95
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // Main RAF loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')!
    let stopped = false

    function loop() {
      if (stopped) return
      rafRef.current = requestAnimationFrame(loop)
      frameRef.current++
      const frame = frameRef.current
      const { panX, panY, zoom } = vpRef.current
      const cw = canvas!.width, ch = canvas!.height

      // Clear
      ctx2d.clearRect(0, 0, cw, ch)
      ctx2d.fillStyle = '#0A0A0F'
      ctx2d.fillRect(0, 0, cw, ch)

      // Apply viewport transform
      ctx2d.save()
      ctx2d.setTransform(zoom, 0, 0, zoom, cw / 2 - panX * zoom, ch / 2 - panY * zoom)

      // Draw connections (faint lines between nearby cities)
      ctx2d.strokeStyle = '#1E1E2E'
      ctx2d.lineWidth = 0.5 / zoom
      const cityList = Object.entries(CITIES) as [CityId, typeof CITIES[CityId]][]
      for (let i = 0; i < cityList.length; i++) {
        for (let j = i + 1; j < cityList.length; j++) {
          const [,a] = cityList[i]; const [,b] = cityList[j]
          if (Math.hypot(a.x - b.x, a.y - b.y) < 200) {
            ctx2d.beginPath(); ctx2d.moveTo(a.x, a.y); ctx2d.lineTo(b.x, b.y); ctx2d.stroke()
          }
        }
      }

      // Draw particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      for (const p of particlesRef.current) {
        const alpha = p.life / p.maxLife
        ctx2d.globalAlpha = alpha * 0.7
        ctx2d.fillStyle = p.color
        ctx2d.beginPath(); ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx2d.fill()
        p.x += p.vx; p.y += p.vy; p.life--
      }
      ctx2d.globalAlpha = 1

      // Emit particles for each city (rate-limited)
      for (const cityId of Object.keys(CITIES) as CityId[]) {
        const trait = CITY_TRAITS[cityId]
        const rate = trait.particleType === 'wind' ? 8 : trait.particleType === 'smoke' ? 12 : 20
        if (frame % rate === 0) emitParticle(cityId)
      }

      // Draw attack units
      for (let i = unitsRef.current.length - 1; i >= 0; i--) {
        const unit = unitsRef.current[i]
        const from = CITIES[unit.fromCity]; const to = CITIES[unit.toCity]
        const trait = CITY_TRAITS[unit.toCity]
        unit.progress = Math.min(unit.progress + 0.008 * trait.unitSpeed, 1)

        unit.x = from.x + (to.x - from.x) * unit.progress + unit.drift * Math.sin(frame * 0.05) * 10
        unit.y = from.y + (to.y - from.y) * unit.progress + Math.sin(unit.wave + frame * 0.1) * 4

        // Trail
        unit.trail.push({ x: unit.x, y: unit.y })
        if (unit.trail.length > 5) unit.trail.shift()

        // Draw trail
        const c = FACTIONS[unit.faction].color
        for (let t = 0; t < unit.trail.length - 1; t++) {
          const alpha = (t / unit.trail.length) * 0.4
          ctx2d.strokeStyle = c; ctx2d.lineWidth = 2 / zoom; ctx2d.globalAlpha = alpha
          ctx2d.beginPath()
          ctx2d.moveTo(unit.trail[t].x, unit.trail[t].y)
          ctx2d.lineTo(unit.trail[t+1].x, unit.trail[t+1].y)
          ctx2d.stroke()
        }
        ctx2d.globalAlpha = 1

        // Draw unit pixel
        ctx2d.fillStyle = c
        ctx2d.fillRect(unit.x - 3/zoom, unit.y - 3/zoom, 6/zoom, 6/zoom)

        if (unit.progress >= 1) unitsRef.current.splice(i, 1)
      }

      // Spawn units for selected target
      if (selectedTarget && frame % 15 === 0) {
        spawnUnit(userCityId, selectedTarget, userFaction)
      }

      // Draw cities
      for (const [cityId, cfg] of cityList) {
        const cs    = stateRef.current.get(cityId)
        const owner = (cs?.owner as FactionId) ?? cfg.faction
        const fc    = FACTIONS[owner]
        const sprU  = Math.max(2, Math.min(4, zoom * 3))

        // Draw sprite
        ctx2d.save()
        drawCitySprite(ctx2d, cityId, cfg.x, cfg.y - 10, sprU, owner)
        ctx2d.restore()

        // HP bar
        if (cs) {
          const hpPct = cs.hp / cs.maxHp
          const barW = 40; const barH = 4
          ctx2d.fillStyle = '#111118'
          ctx2d.fillRect(cfg.x - barW/2, cfg.y + 8, barW, barH)
          ctx2d.fillStyle = hpPct > 0.5 ? '#10B981' : hpPct > 0.2 ? '#F59E0B' : '#EF4444'
          ctx2d.fillRect(cfg.x - barW/2, cfg.y + 8, barW * hpPct, barH)
        }

        // City label
        ctx2d.fillStyle = fc.color
        ctx2d.font = `bold ${Math.max(8, 10 / zoom)}px monospace`
        ctx2d.textAlign = 'center'
        ctx2d.fillText(cfg.nameRu, cfg.x, cfg.y + 20)

        // Selection ring
        if (cityId === selectedTarget) {
          ctx2d.strokeStyle = '#EF4444'
          ctx2d.lineWidth = 2 / zoom
          ctx2d.setLineDash([4 / zoom, 4 / zoom])
          ctx2d.beginPath(); ctx2d.arc(cfg.x, cfg.y, 28, 0, Math.PI * 2); ctx2d.stroke()
          ctx2d.setLineDash([])
        }
        if (cityId === userCityId) {
          ctx2d.strokeStyle = fc.color
          ctx2d.lineWidth = 1.5 / zoom
          ctx2d.beginPath(); ctx2d.arc(cfg.x, cfg.y, 22, 0, Math.PI * 2); ctx2d.stroke()
        }

        // Capture flash
        const flash = flashRef.current.get(cityId)
        if (flash) {
          const alpha = Math.max(0, 1 - flash.frame / 30)
          const grad  = ctx2d.createRadialGradient(cfg.x, cfg.y, 0, cfg.x, cfg.y, 60)
          grad.addColorStop(0, flash.color + Math.round(alpha * 200).toString(16).padStart(2,'0'))
          grad.addColorStop(1, 'transparent')
          ctx2d.fillStyle = grad
          ctx2d.beginPath(); ctx2d.arc(cfg.x, cfg.y, 60, 0, Math.PI * 2); ctx2d.fill()
          flash.frame++
          if (flash.frame > 30) flashRef.current.delete(cityId)
        }
      }

      ctx2d.restore()

      // Minimap
      const mm = { x: 8, y: ch - MINIMAP_H - 8, w: MINIMAP_W, h: MINIMAP_H }
      ctx2d.fillStyle = '#111118CC'
      ctx2d.fillRect(mm.x, mm.y, mm.w, mm.h)
      ctx2d.strokeStyle = '#1E1E2E'; ctx2d.lineWidth = 1; ctx2d.strokeRect(mm.x, mm.y, mm.w, mm.h)

      for (const [cId, cfg] of cityList) {
        const cs = stateRef.current.get(cId)
        const owner = (cs?.owner as FactionId) ?? cfg.faction
        const mx = mm.x + (cfg.x / CANVAS_W) * mm.w
        const my = mm.y + (cfg.y / CANVAS_H) * mm.h
        ctx2d.fillStyle = FACTIONS[owner].color
        ctx2d.beginPath(); ctx2d.arc(mx, my, 2.5, 0, Math.PI * 2); ctx2d.fill()
      }

      // Minimap viewport rect
      const vx = mm.x + ((panX - cw / 2 / zoom) / CANVAS_W) * mm.w
      const vy = mm.y + ((panY - ch / 2 / zoom) / CANVAS_H) * mm.h
      const vw = (cw / zoom / CANVAS_W) * mm.w
      const vh = (ch / zoom / CANVAS_H) * mm.h
      ctx2d.strokeStyle = '#FFFFFF44'; ctx2d.lineWidth = 0.8
      ctx2d.strokeRect(vx, vy, vw, vh)
    }

    loop()

    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(rafRef.current); stopped = true }
      else { stopped = false; loop() }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stopped = true; cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [selectedTarget, userCityId, userFaction, emitParticle, spawnUnit])

  // Touch / pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    touchRef.current = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !touchRef.current) return
    const dx = e.clientX - touchRef.current.x
    const dy = e.clientY - touchRef.current.y
    vpRef.current.panX -= dx / vpRef.current.zoom
    vpRef.current.panY -= dy / vpRef.current.zoom
    touchRef.current.x = e.clientX; touchRef.current.y = e.clientY
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    const t = touchRef.current
    touchRef.current = null
    if (!t) return
    const moved = Math.hypot(e.clientX - t.startX, e.clientY - t.startY)
    if (moved < 8) {
      const { wx, wy } = toWorld(e.clientX - (canvasRef.current?.getBoundingClientRect().left ?? 0), e.clientY - (canvasRef.current?.getBoundingClientRect().top ?? 0))
      const city = findCityAt(wx, wy)
      if (city) onCityClick(city)
    }
  }, [toWorld, findCityAt, onCityClick])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    vpRef.current.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, vpRef.current.zoom * delta))
  }, [])

  // Touch events (mobile)
  const touch1 = useRef<{ x: number; y: number } | null>(null)
  const touch2 = useRef<{ x: number; y: number } | null>(null)
  const lastTouchDist = useRef<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      touch1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touch2.current = null; lastTouchDist.current = null
    } else if (e.touches.length === 2) {
      touch1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touch2.current = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      lastTouchDist.current = Math.hypot(
        touch1.current.x - touch2.current.x,
        touch1.current.y - touch2.current.y
      )
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && touch1.current) {
      const dx = e.touches[0].clientX - touch1.current.x
      const dy = e.touches[0].clientY - touch1.current.y
      vpRef.current.panX -= dx / vpRef.current.zoom
      vpRef.current.panY -= dy / vpRef.current.zoom
      touch1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = dist / lastTouchDist.current
      vpRef.current.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, vpRef.current.zoom * delta))
      lastTouchDist.current = dist
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.changedTouches.length === 1 && !touch2.current) {
      const t = e.changedTouches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const { wx, wy } = toWorld(t.clientX - rect.left, t.clientY - rect.top)
      const city = findCityAt(wx, wy)
      if (!city) { lastTap.current = null; touch1.current = null; return }

      // Double-tap detection
      const now = Date.now()
      if (lastTap.current?.city === city && now - lastTap.current.time < 400) {
        if (navigator.vibrate) navigator.vibrate([30, 10, 30])
        onCityDblTap(city)
        lastTap.current = null
      } else {
        if (navigator.vibrate) navigator.vibrate(12)
        onCityClick(city)
        lastTap.current = { city, time: now }
      }
    }
    touch1.current = null; touch2.current = null; lastTouchDist.current = null
  }, [toWorld, findCityAt, onCityClick, onCityDblTap])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none', cursor: 'crosshair' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  )
})
