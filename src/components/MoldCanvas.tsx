import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/store/useStore'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import type { MaterialElement } from '@/types'
import { RotateCw, Maximize2, Trash2 } from 'lucide-react'

const PADDING = 40
const GRID_SIZE = 20
const HANDLE_SIZE = 8
const CORNER_RADIUS = 4
const NUDGE = 2

type DragMode = 'move' | 'resize' | 'rotate' | null

export default function MoldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const dragRef = useRef<{ mode: DragMode; id: string; ox: number; oy: number; ex: number; ey: number; eScale?: number; eRot?: number; corner?: number } | null>(null)

  const currentMoldType = useStore((s) => s.currentMoldType)
  const layers = useStore((s) => s.layers)
  const stages = useStore((s) => s.stages)
  const currentStageId = useStore((s) => s.currentStageId)
  const selectedElementId = useStore((s) => s.selectedElementId)
  const selectElement = useStore((s) => s.selectElement)
  const updateElement = useStore((s) => s.updateElement)
  const removeElement = useStore((s) => s.removeElement)

  const mold = MOLD_SHAPE_MAP[currentMoldType]

  const visibleLayerIds = (() => {
    if (!currentStageId) return layers.map((l) => l.id)
    const sortedStages = [...stages].sort((a, b) => a.order - b.order)
    const currentIdx = sortedStages.findIndex((s) => s.id === currentStageId)
    if (currentIdx === -1) return layers.map((l) => l.id)
    const ids = new Set<string>()
    for (let i = 0; i <= currentIdx; i++) {
      sortedStages[i].layerIds.forEach((id) => ids.add(id))
    }
    const unassigned = layers.filter((l) => !stages.some((s) => s.layerIds.includes(l.id)))
    unassigned.forEach((l) => ids.add(l.id))
    return Array.from(ids)
  })()

  const activeLayerIds = (() => {
    if (!currentStageId) return new Set<string>()
    const stage = stages.find((s) => s.id === currentStageId)
    return new Set(stage?.layerIds || [])
  })()

  const filteredLayers = layers.filter((l) => visibleLayerIds.includes(l.id))
  const sorted = [...filteredLayers].sort((a, b) => a.order - b.order)

  const getScale = useCallback(() => {
    if (canvasSize.w === 0 || canvasSize.h === 0) return { s: 100, cx: 0, cy: 0 }
    const aw = canvasSize.w - PADDING * 2
    const ah = canvasSize.h - PADDING * 2
    const s = Math.min(aw / mold.width, ah / mold.height) * 100
    return { s, cx: canvasSize.w / 2, cy: canvasSize.h / 2 }
  }, [canvasSize, mold])

  const toCanvas = useCallback((x: number, y: number, w: number, h: number) => {
    const { s, cx, cy } = getScale()
    const f = s / 100
    return { x: cx + x * f, y: cy + y * f, w: w * f, h: h * f }
  }, [getScale])

  const fromCanvas = useCallback((px: number, py: number) => {
    const { s, cx, cy } = getScale()
    const f = s / 100
    return { x: (px - cx) / f, y: (py - cy) / f }
  }, [getScale])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w, h } = canvasSize
    if (w === 0 || h === 0) return

    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = '#3D2A1E'
    ctx.lineWidth = 0.5
    for (let x = 0; x < w; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    const { s, cx, cy } = getScale()
    const pathStr = mold.path(cx, cy, s)
    const moldPath = new Path2D(pathStr)
    ctx.save()
    ctx.fillStyle = 'rgba(212, 165, 116, 0.06)'
    ctx.fill(moldPath)
    ctx.restore()
    ctx.strokeStyle = '#D4A574'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.stroke(moldPath)
    ctx.setLineDash([])

    for (const layer of sorted) {
      ctx.save()
      const isActiveStage = activeLayerIds.size > 0 && activeLayerIds.has(layer.id)
      const isPastStage = activeLayerIds.size > 0 && !isActiveStage && visibleLayerIds.includes(layer.id)
      ctx.globalAlpha = layer.opacity * (isPastStage ? 0.6 : 1)
      if (isActiveStage) {
        ctx.shadowColor = 'rgba(201, 169, 110, 0.4)'
        ctx.shadowBlur = 8
      }
      for (const el of layer.elements) {
        const p = toCanvas(el.x, el.y, el.width * el.scale, el.height * el.scale)
        const r = Math.min(CORNER_RADIUS, p.w / 4, p.h / 4)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((el.rotation * Math.PI) / 180)

        ctx.beginPath()
        ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, r)
        const grad = ctx.createLinearGradient(-p.w / 2, -p.h / 2, p.w / 2, p.h / 2)
        grad.addColorStop(0, el.color)
        grad.addColorStop(1, adjustBrightness(el.color, -20))
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1
        ctx.stroke()

        if (el.category === 'glitter' || el.category === 'goldFoil') {
          ctx.globalAlpha = 0.6
          for (let i = 0; i < 5; i++) {
            const sx = -p.w / 2 + Math.random() * p.w
            const sy = -p.h / 2 + Math.random() * p.h
            ctx.fillStyle = 'rgba(255,255,255,0.8)'
            ctx.fillRect(sx, sy, 2, 2)
          }
        }

        ctx.restore()

        ctx.save()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#F5E6D3'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 2
        ctx.fillText(el.name, p.x, p.y - p.h / 2 - 8)
        ctx.restore()

        if (el.id === selectedElementId) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate((el.rotation * Math.PI) / 180)
          ctx.globalAlpha = 1

          ctx.setLineDash([5, 3])
          ctx.strokeStyle = '#F5E6D3'
          ctx.lineWidth = 2
          ctx.strokeRect(-p.w / 2 - 4, -p.h / 2 - 4, p.w + 8, p.h + 8)
          ctx.setLineDash([])

          const hs = HANDLE_SIZE
          ctx.fillStyle = '#D4A574'
          ctx.strokeStyle = '#2C1810'
          ctx.lineWidth = 1.5
          const corners = [
            [-p.w / 2 - 4, -p.h / 2 - 4],
            [p.w / 2 + 4, -p.h / 2 - 4],
            [-p.w / 2 - 4, p.h / 2 + 4],
            [p.w / 2 + 4, p.h / 2 + 4],
          ]
          for (const [hx, hy] of corners) {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs)
            ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs)
          }

          const rotateX = 0
          const rotateY = -p.h / 2 - 20
          ctx.beginPath()
          ctx.arc(rotateX, rotateY, hs * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = '#87CEEB'
          ctx.fill()
          ctx.strokeStyle = '#2C1810'
          ctx.stroke()

          ctx.strokeStyle = '#87CEEB'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(rotateX, rotateY + hs * 0.8)
          ctx.lineTo(0, -p.h / 2 - 4)
          ctx.stroke()

          ctx.restore()
        }
      }
      ctx.restore()
    }
  }, [canvasSize, sorted, selectedElementId, mold, getScale, toCanvas, activeLayerIds, visibleLayerIds])

  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.w * dpr
    canvas.height = canvasSize.h * dpr
    canvas.style.width = `${canvasSize.w}px`
    canvas.style.height = `${canvasSize.h}px`
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
  }, [canvasSize])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    if (!selectedElementId) return
    const el = sorted.flatMap((l) => l.elements).find((e) => e.id === selectedElementId)
    if (!el) return
    const layer = layers.find((l) => l.id === el.layerId)
    if (layer?.locked) {
      selectElement(null)
    }
  }, [layers, selectedElementId, selectElement, sorted])

  const hitTest = useCallback((px: number, py: number): { el: MaterialElement; hit: 'body' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'rotate' } | null => {
    for (let i = sorted.length - 1; i >= 0; i--) {
      const layer = sorted[i]
      if (layer.locked) continue
      for (const el of layer.elements) {
        const p = toCanvas(el.x, el.y, el.width * el.scale, el.height * el.scale)
        const cos = Math.cos((-el.rotation * Math.PI) / 180)
        const sin = Math.sin((-el.rotation * Math.PI) / 180)
        const dx = px - p.x
        const dy = py - p.y
        const lx = dx * cos - dy * sin
        const ly = dx * sin + dy * cos

        const hw = p.w / 2
        const hh = p.h / 2
        const hs = HANDLE_SIZE

        if (el.id === selectedElementId) {
          const corners: [string, number, number][] = [
            ['resize-tl', -hw - 4, -hh - 4],
            ['resize-tr', hw + 4, -hh - 4],
            ['resize-bl', -hw - 4, hh + 4],
            ['resize-br', hw + 4, hh + 4],
          ]
          for (const [name, cx, cy] of corners) {
            if (Math.abs(lx - cx) <= hs && Math.abs(ly - cy) <= hs) {
              return { el, hit: name as 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' }
            }
          }
          const rotX = 0
          const rotY = -hh - 20
          if (Math.sqrt((lx - rotX) ** 2 + (ly - rotY) ** 2) <= hs * 0.9) {
            return { el, hit: 'rotate' }
          }
        }

        if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
          return { el, hit: 'body' }
        }
      }
    }
    return null
  }, [sorted, toCanvas, selectedElementId])

  const getMousePos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const result = hitTest(pos.x, pos.y)
    if (result) {
      const { el, hit } = result
      selectElement(el.id)
      if (hit === 'body') {
        dragRef.current = { mode: 'move', id: el.id, ox: pos.x, oy: pos.y, ex: el.x, ey: el.y }
      } else if (hit.startsWith('resize')) {
        const corner = ['resize-tl', 'resize-tr', 'resize-bl', 'resize-br'].indexOf(hit)
        dragRef.current = { mode: 'resize', id: el.id, ox: pos.x, oy: pos.y, ex: el.x, ey: el.y, eScale: el.scale, corner }
      } else if (hit === 'rotate') {
        const p = toCanvas(el.x, el.y, 0, 0)
        const startAngle = Math.atan2(pos.y - p.y, pos.x - p.x) * 180 / Math.PI
        dragRef.current = { mode: 'rotate', id: el.id, ox: startAngle, oy: 0, ex: 0, ey: 0, eRot: el.rotation }
      }
    } else {
      selectElement(null)
    }
  }, [hitTest, selectElement, getMousePos, toCanvas])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    const pos = getMousePos(e)
    const { mode, id, ox, oy, ex, ey, eScale, eRot, corner } = dragRef.current

    if (mode === 'move') {
      const delta = fromCanvas(pos.x - ox, pos.y - oy)
      updateElement(id, { x: ex + delta.x, y: ey + delta.y })
    } else if (mode === 'resize' && typeof eScale === 'number' && typeof corner === 'number') {
      const deltaPx = Math.max(pos.x - ox, pos.y - oy)
      const { s } = getScale()
      const f = s / 100
      const deltaWorld = deltaPx / f
      const baseSize = 100
      let newScale = eScale + deltaWorld / baseSize
      newScale = Math.max(0.3, Math.min(3, newScale))
      updateElement(id, { scale: Math.round(newScale * 100) / 100 })
    } else if (mode === 'rotate' && typeof eRot === 'number') {
      const el = sorted.flatMap(l => l.elements).find(e => e.id === id)
      if (el) {
        const p = toCanvas(el.x, el.y, 0, 0)
        const currentAngle = Math.atan2(pos.y - p.y, pos.x - p.x) * 180 / Math.PI
        let newRot = eRot + (currentAngle - ox)
        if (e.shiftKey) {
          newRot = Math.round(newRot / 15) * 15
        }
        updateElement(id, { rotation: newRot })
      }
    }
  }, [getMousePos, fromCanvas, updateElement, getScale, sorted, toCanvas])

  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedElementId) return
    const el = sorted.flatMap((l) => l.elements).find((el) => el.id === selectedElementId)
    if (!el) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      removeElement(el.id)
      return
    }
    if (e.key === 'r' || e.key === 'R') {
      updateElement(el.id, { rotation: 0 })
      return
    }
    const nudge = e.shiftKey ? NUDGE * 5 : NUDGE
    const moves: Record<string, { x?: number; y?: number; scale?: number; rotation?: number }> = {
      ArrowUp: { y: el.y - nudge },
      ArrowDown: { y: el.y + nudge },
      ArrowLeft: { x: el.x - nudge },
      ArrowRight: { x: el.x + nudge },
      '[': { scale: Math.max(0.3, el.scale - 0.1) },
      ']': { scale: Math.min(3, el.scale + 0.1) },
    }
    if (moves[e.key]) {
      e.preventDefault()
      const updates = moves[e.key]
      if ('scale' in updates && updates.scale !== undefined) {
        updates.scale = Math.round(updates.scale * 100) / 100
      }
      updateElement(el.id, updates)
    }
  }, [selectedElementId, sorted, updateElement, removeElement])

  const selectedEl = selectedElementId
    ? sorted.flatMap((l) => l.elements).find((e) => e.id === selectedElementId)
    : null

  return (
    <div ref={containerRef} className="w-full h-full relative outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      <canvas
        id="mold-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-crosshair"
      />
      {selectedEl && (
        <div
          className="absolute flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg"
          style={{
            background: 'rgba(74, 55, 40, 0.95)',
            border: '1px solid rgba(201, 169, 110, 0.4)',
            backdropFilter: 'blur(4px)',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-xs px-1" style={{ color: '#FFF8F0' }}>{selectedEl.name}</span>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,169,110,0.25)' }} />
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#8B7355' }}>缩放</span>
            <span className="text-xs font-medium w-10 text-center" style={{ color: '#C9A96E' }}>
              {Math.round(selectedEl.scale * 100)}%
            </span>
            <button
              onClick={() => updateElement(selectedEl.id, { scale: Math.max(0.3, Math.round((selectedEl.scale - 0.1) * 100) / 100) })}
              className="w-6 h-6 flex items-center justify-center rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}
            >−</button>
            <button
              onClick={() => updateElement(selectedEl.id, { scale: Math.min(3, Math.round((selectedEl.scale + 0.1) * 100) / 100) })}
              className="w-6 h-6 flex items-center justify-center rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}
            >+</button>
          </div>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,169,110,0.25)' }} />
          <div className="flex items-center gap-1">
            <RotateCw size={12} style={{ color: '#8B7355' }} />
            <span className="text-xs font-medium w-10 text-center" style={{ color: '#87CEEB' }}>
              {Math.round(selectedEl.rotation % 360)}°
            </span>
            <button
              onClick={() => updateElement(selectedEl.id, { rotation: selectedEl.rotation - 15 })}
              className="w-6 h-6 flex items-center justify-center rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}
            >↺</button>
            <button
              onClick={() => updateElement(selectedEl.id, { rotation: selectedEl.rotation + 15 })}
              className="w-6 h-6 flex items-center justify-center rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}
            >↻</button>
            <button
              onClick={() => updateElement(selectedEl.id, { rotation: 0 })}
              className="px-2 h-6 flex items-center justify-center rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}
            >重置</button>
          </div>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,169,110,0.25)' }} />
          <div className="flex items-center gap-1">
            <Maximize2 size={12} style={{ color: '#8B7355' }} />
            <span className="text-xs" style={{ color: '#FFF8F0' }}>
              {Math.round(selectedEl.width * selectedEl.scale)}×{Math.round(selectedEl.height * selectedEl.scale)}
            </span>
          </div>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,169,110,0.25)' }} />
          <button
            onClick={() => removeElement(selectedEl.id)}
            className="w-7 h-6 flex items-center justify-center rounded text-xs"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
            title="删除 (Delete)"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
      {!selectedEl && layers.flatMap(l => l.elements).length === 0 && (
        <div
          className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
          style={{
            inset: 0,
            color: '#8B7355',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🌸</div>
          <div className="text-sm font-medium" style={{ color: '#C9A96E' }}>开始您的滴胶创作</div>
          <div className="text-xs mt-1">从左侧素材库中选择材料，添加到画布上</div>
        </div>
      )}
    </div>
  )
}
