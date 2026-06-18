import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { StageType } from '@/types'
import {
  Plus,
  Trash2,
  Settings2,
  Thermometer,
  Droplets,
  Ruler,
  Clock,
  Package,
  StickyNote,
  X,
  GripVertical,
  Layers,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { getStageLabel, getRiskLabel, getRiskColor, estimateCuring } from '@/utils/curingCalculator'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'

const STAGE_TYPES: { value: StageType; label: string; icon: string }[] = [
  { value: 'base', label: '底胶层', icon: '🟫' },
  { value: 'material', label: '材料定位层', icon: '🌸' },
  { value: 'sealant', label: '封胶层', icon: '💧' },
  { value: 'correction', label: '补胶修正层', icon: '✨' },
]

const STAGE_COLORS: Record<StageType, string> = {
  base: '#8B5A2B',
  material: '#C9A96E',
  sealant: '#87CEEB',
  correction: '#6B8E6B',
}

export default function StageTimeline() {
  const stages = useStore((s) => s.stages)
  const currentStageId = useStore((s) => s.currentStageId)
  const ambientTemp = useStore((s) => s.ambientTemp)
  const layers = useStore((s) => s.layers)
  const currentMoldType = useStore((s) => s.currentMoldType)
  const addStage = useStore((s) => s.addStage)
  const removeStage = useStore((s) => s.removeStage)
  const updateStage = useStore((s) => s.updateStage)
  const selectStage = useStore((s) => s.selectStage)
  const setAmbientTemp = useStore((s) => s.setAmbientTemp)
  const assignLayerToStage = useStore((s) => s.assignLayerToStage)
  const removeLayerFromStage = useStore((s) => s.removeLayerFromStage)

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [configStageId, setConfigStageId] = useState<string | null>(null)

  const moldShape = MOLD_SHAPE_MAP[currentMoldType]
  const estimate = estimateCuring(
    layers,
    currentMoldType,
    moldShape.width,
    moldShape.height,
    moldShape.areaMm2,
    stages,
    ambientTemp
  )

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)
  const maxHours = Math.max(...estimate.stageDetails.map((s) => s.hours), 1)

  const getStageRisk = (stageId: string) => {
    return estimate.stageDetails.find((s) => s.stageId === stageId)
  }

  const handleAddStage = (type: StageType) => {
    addStage(type)
    setShowAddMenu(false)
  }

  const handleToggleConfig = (stageId: string) => {
    setConfigStageId(configStageId === stageId ? null : stageId)
  }

  const handleToggleLayerAssign = (stageId: string, layerId: string, assigned: boolean) => {
    if (assigned) {
      removeLayerFromStage(stageId, layerId)
    } else {
      assignLayerToStage(stageId, layerId)
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        background: '#352318',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>制作阶段</span>
          <span className="text-xs" style={{ color: '#8B7355' }}>
            ({sortedStages.length} 阶段)
          </span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Thermometer size={12} style={{ color: '#8B7355' }} />
          <span className="text-xs" style={{ color: '#8B7355' }}>环境温度</span>
          <input
            type="number"
            min={5}
            max={40}
            step={1}
            value={ambientTemp}
            onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 25)}
            className="w-14 text-xs rounded px-1.5 py-0.5"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
          />
          <span className="text-xs" style={{ color: '#8B7355' }}>°C</span>
        </div>

        <div className="flex-1" />

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E' }}
          >
            <Plus size={14} />
            添加阶段
          </button>
          {showAddMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded shadow-lg z-20"
              style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)' }}
            >
              {STAGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleAddStage(t.value)}
                  className="block w-full text-left px-3 py-2 text-xs"
                  style={{ color: '#FFF8F0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 pb-2 pt-1 overflow-x-auto scrollbar-thin">
        {sortedStages.map((stage, idx) => {
          const isActive = stage.id === currentStageId
          const risk = getStageRisk(stage.id)
          const isConfigOpen = configStageId === stage.id
          const stageLayers = layers.filter((l) => stage.layerIds.includes(l.id))
          return (
            <div key={stage.id} className="flex items-stretch gap-2">
              <div className="flex flex-col" style={{ minWidth: 200 }}>
                <div
                  className={`flex flex-col rounded-lg p-2 cursor-pointer relative ${isActive ? 'ring-2 ring-amber-400/60' : ''}`}
                  style={{
                    background: isActive ? 'rgba(201,169,110,0.18)' : 'rgba(0,0,0,0.2)',
                    borderLeft: `3px solid ${STAGE_COLORS[stage.type]}`,
                    opacity: 1,
                  }}
                  onClick={() => selectStage(stage.id)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <GripVertical size={12} style={{ color: '#8B7355' }} />
                    <span
                      className="text-xs font-medium truncate flex-1"
                      style={{ color: '#FFF8F0' }}
                    >
                      {stage.name}
                    </span>
                    {risk && risk.riskMessages.length > 0 && (
                      <AlertTriangle
                        size={12}
                        style={{ color: getRiskColor(risk.riskLevel) }}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (stages.length > 1) {
                          removeStage(stage.id)
                        }
                      }}
                      style={{ color: stages.length > 1 ? '#8B7355' : '#5A4A3A' }}
                      title="删除阶段"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleConfig(stage.id)
                      }}
                      style={{ color: isConfigOpen ? '#C9A96E' : '#8B7355' }}
                      title="配置阶段"
                    >
                      <Settings2 size={12} />
                    </button>
                  </div>

                  <div className="text-xs mb-1" style={{ color: '#8B7355' }}>
                    {getStageLabel(stage.type)} · {stageLayers.length} 图层
                  </div>

                  <div
                    className="w-full rounded-full"
                    style={{ height: 4, background: 'rgba(0,0,0,0.3)' }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        height: '100%',
                        width: `${((risk?.hours || 0) / maxHours) * 100}%`,
                        background: STAGE_COLORS[stage.type],
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: '#8B7355' }}>
                    <Clock size={10} />
                    <span>{risk?.hours.toFixed(1)}h</span>
                    <Droplets size={10} />
                    <span>{risk?.resinMl.toFixed(1)}ml</span>
                    {risk && (
                      <span
                        className="ml-auto"
                        style={{ color: getRiskColor(risk.riskLevel) }}
                      >
                        {getRiskLabel(risk.riskLevel)}
                      </span>
                    )}
                  </div>
                </div>

                {isConfigOpen && (
                  <div
                    className="mt-1 rounded-lg p-2 fade-in"
                    style={{
                      background: '#4A3728',
                      border: '1px solid rgba(201,169,110,0.25)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>
                        阶段配置
                      </span>
                      <button onClick={() => setConfigStageId(null)} style={{ color: '#8B7355' }}>
                        <X size={12} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs w-14" style={{ color: '#8B7355' }}>名称</span>
                        <input
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                          className="flex-1 text-xs rounded px-1.5 py-0.5 outline-none"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Droplets size={12} style={{ color: '#87CEEB' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>胶量</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={stage.glueMl}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              glueMl: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                        <span className="text-xs" style={{ color: '#8B7355' }}>ml (0=自动)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Ruler size={12} style={{ color: '#C9A96E' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>厚度</span>
                        <input
                          type="number"
                          min={0.1}
                          max={10}
                          step={0.1}
                          value={stage.thickness}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              thickness: parseFloat(e.target.value) || 0.5,
                            })
                          }
                          className="w-16 text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                        <span className="text-xs" style={{ color: '#8B7355' }}>mm</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock size={12} style={{ color: '#F59E0B' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>等待</span>
                        <input
                          type="number"
                          min={0}
                          max={72}
                          step={0.5}
                          value={stage.waitHours}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              waitHours: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                        <span className="text-xs" style={{ color: '#8B7355' }}>h (0=自动)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Thermometer size={12} style={{ color: '#EF4444' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>温度</span>
                        <input
                          type="number"
                          min={5}
                          max={40}
                          step={1}
                          value={stage.ambientTemp}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              ambientTemp: parseFloat(e.target.value) || 25,
                            })
                          }
                          className="w-16 text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                        <span className="text-xs" style={{ color: '#8B7355' }}>°C</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Package size={12} style={{ color: '#6B8E6B' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>批次</span>
                        <input
                          value={stage.materialBatch}
                          onChange={(e) =>
                            updateStage(stage.id, { materialBatch: e.target.value })
                          }
                          placeholder="材料批次号"
                          className="flex-1 text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                      </div>

                      <div className="flex items-start gap-1.5">
                        <StickyNote size={12} style={{ color: '#8B7355' }} />
                        <span className="text-xs w-12" style={{ color: '#8B7355' }}>备注</span>
                        <textarea
                          value={stage.notes}
                          onChange={(e) => updateStage(stage.id, { notes: e.target.value })}
                          placeholder="阶段备注..."
                          rows={2}
                          className="flex-1 text-xs rounded px-1.5 py-0.5 resize-none outline-none"
                          style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                        />
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Layers size={12} style={{ color: '#C9A96E' }} />
                          <span className="text-xs" style={{ color: '#C9A96E' }}>分配图层</span>
                        </div>
                        {layers.length === 0 && (
                          <div className="text-xs" style={{ color: '#8B7355' }}>
                            暂无图层
                          </div>
                        )}
                        <div className="space-y-0.5 max-h-24 overflow-y-auto scrollbar-thin">
                          {layers.map((layer) => {
                            const assigned = stage.layerIds.includes(layer.id)
                            return (
                              <label
                                key={layer.id}
                                className="flex items-center gap-1.5 cursor-pointer"
                                style={{ color: assigned ? '#FFF8F0' : '#8B7355' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={assigned}
                                  onChange={() =>
                                    handleToggleLayerAssign(stage.id, layer.id, assigned)
                                  }
                                  style={{ accentColor: '#C9A96E' }}
                                />
                                <Eye
                                  size={10}
                                  style={{ opacity: layer.opacity }}
                                />
                                <span className="text-xs truncate">{layer.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {risk && risk.suggestions.length > 0 && (
                        <div
                          className="mt-1 p-1 rounded"
                          style={{
                            background: `${getRiskColor(risk.riskLevel)}15`,
                          }}
                        >
                          <div className="text-xs font-medium" style={{ color: getRiskColor(risk.riskLevel) }}>
                            操作建议
                          </div>
                          {risk.suggestions.slice(0, 2).map((tip, i) => (
                            <div key={i} className="text-xs" style={{ color: '#FFF8F0' }}>
                              • {tip}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {idx < sortedStages.length - 1 && (
                <div
                  className="flex items-center"
                  style={{ color: '#8B7355' }}
                >
                  <div
                    style={{ width: 16, height: 1, background: 'rgba(201,169,110,0.3)' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
