import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { MaterialCategory } from '@/types'
import { Eye, EyeOff, Trash2, Lock, Unlock, GripVertical, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const LAYER_TYPES: { value: MaterialCategory; label: string }[] = [
  { value: 'driedFlower', label: '干花层' },
  { value: 'glitter', label: '亮片层' },
  { value: 'goldFoil', label: '金箔层' },
  { value: 'colorPowder', label: '色粉层' },
]

export default function LayerPanel() {
  const layers = useStore((s) => s.layers)
  const selectedLayerId = useStore((s) => s.selectedLayerId)
  const addLayer = useStore((s) => s.addLayer)
  const removeLayer = useStore((s) => s.removeLayer)
  const updateLayer = useStore((s) => s.updateLayer)
  const reorderLayers = useStore((s) => s.reorderLayers)
  const selectLayer = useStore((s) => s.selectLayer)

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())

  const handleAddLayer = (type: MaterialCategory) => {
    addLayer(type, '')
    setShowAddMenu(false)
  }

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleFinishEdit = (id: string) => {
    if (editName.trim()) {
      updateLayer(id, { name: editName.trim() })
    }
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full" style={{ width: 280, background: '#3D2B1F', borderLeft: '1px solid rgba(201,169,110,0.2)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>层级管理</h2>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E' }}
          >
            <Plus size={14} />
            添加层
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 rounded shadow-lg z-10" style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)' }}>
              {LAYER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleAddLayer(t.value)}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-opacity-20"
                  style={{ color: '#FFF8F0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {layers.map((layer, index) => {
          const isActive = layer.id === selectedLayerId
          const isEditing = layer.id === editingId
          return (
            <div
              key={layer.id}
              className="layer-item rounded p-2 cursor-pointer"
              style={{
                background: isActive ? 'rgba(201,169,110,0.12)' : 'rgba(0,0,0,0.15)',
                borderLeft: isActive ? '3px solid #C9A96E' : '3px solid transparent',
              }}
              onClick={() => selectLayer(layer.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <GripVertical size={14} style={{ color: '#8B7355', flexShrink: 0 }} />
                {isEditing ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleFinishEdit(layer.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit(layer.id)}
                    className="flex-1 text-xs rounded px-1 py-0.5 outline-none"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid #C9A96E' }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="flex-1 text-xs truncate"
                    style={{ color: '#FFF8F0' }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(layer.id, layer.name)
                    }}
                  >
                    {layer.name}
                  </span>
                )}
                <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { opacity: layer.opacity > 0 ? 0 : 1 }) }} style={{ color: '#8B7355' }}>
                  {layer.opacity > 0 ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLockedIds((prev) => { const next = new Set(prev); next.has(layer.id) ? next.delete(layer.id) : next.add(layer.id); return next }) }} style={{ color: '#8B7355' }}>
                  {lockedIds.has(layer.id) ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }} style={{ color: '#8B7355' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-1 pl-5">
                <span className="text-xs" style={{ color: '#8B7355' }}>透明度</span>
                <input
                  type="range"
                  min={0} max={1} step={0.1}
                  value={layer.opacity}
                  onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                  className="flex-1"
                  style={{ accentColor: '#C9A96E' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs w-6 text-right" style={{ color: '#FFF8F0' }}>{layer.opacity.toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-2 pl-5">
                <span className="text-xs" style={{ color: '#8B7355' }}>厚度</span>
                <input
                  type="number"
                  min={0.5} max={5} step={0.5}
                  value={layer.thickness}
                  onChange={(e) => updateLayer(layer.id, { thickness: parseFloat(e.target.value) || 0.5 })}
                  className="w-14 text-xs rounded px-1 py-0.5"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs" style={{ color: '#8B7355' }}>mm</span>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); index > 0 && reorderLayers(index, index - 1) }}
                  disabled={index === 0}
                  style={{ color: index === 0 ? '#5A4A3A' : '#8B7355' }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); index < layers.length - 1 && reorderLayers(index, index + 1) }}
                  disabled={index === layers.length - 1}
                  style={{ color: index === layers.length - 1 ? '#5A4A3A' : '#8B7355' }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2 text-xs" style={{ borderTop: '1px solid rgba(201,169,110,0.15)', color: '#8B7355' }}>
        共 {layers.length} 个图层
      </div>
    </div>
  )
}
