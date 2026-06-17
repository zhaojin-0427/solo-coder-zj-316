import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { estimateCuring, generateStepCards, getCategoryLabel } from '@/utils/curingCalculator'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import { AlertTriangle, Droplets, Scale, Info, AlertOctagon, Beaker, FileText, X } from 'lucide-react'
import { useState } from 'react'

export default function CuringPanel() {
  const layers = useStore((s) => s.layers)
  const currentMoldType = useStore((s) => s.currentMoldType)
  const [showSteps, setShowSteps] = useState(false)

  const moldShape = MOLD_SHAPE_MAP[currentMoldType]
  const estimate = useMemo(
    () => estimateCuring(layers, currentMoldType, moldShape.width * 3, moldShape.height * 3, moldShape.areaMm2),
    [layers, currentMoldType, moldShape]
  )

  const stepCards = useMemo(
    () => generateStepCards(layers, moldShape.areaMm2),
    [layers, moldShape.areaMm2]
  )

  const maxLayerHours = Math.max(...estimate.layerDetails.map((d) => d.hours), 1)

  const warningIcon = (type: string) => {
    switch (type) {
      case 'occlusion': return <AlertOctagon size={14} />
      case 'bubble': return <Droplets size={14} />
      case 'gravity': return <Scale size={14} />
      default: return <Info size={14} />
    }
  }

  const warningColor = (level: string) => {
    switch (level) {
      case 'danger': return '#EF4444'
      case 'warning': return '#F59E0B'
      default: return '#60A5FA'
    }
  }

  return (
    <>
      <div
        className="flex items-start gap-6 px-6 py-3"
        style={{
          background: '#3D2B1F',
          borderTop: '1px solid rgba(201,169,110,0.2)',
          minHeight: 90,
        }}
      >
        <div className="flex flex-col items-center justify-center" style={{ minWidth: 160 }}>
          <span className="text-xs" style={{ color: '#8B7355' }}>预估固化时间</span>
          <span className="font-display text-2xl font-bold" style={{ color: '#C9A96E' }}>
            {estimate.totalHours.toFixed(1)}
            <span className="text-sm font-normal ml-1" style={{ color: '#8B7355' }}>小时</span>
          </span>
          <span className="text-xs" style={{ color: '#8B7355' }}>
            {layers.length} 层 · {layers.reduce((s, l) => s + l.thickness, 0).toFixed(1)} mm
          </span>
        </div>

        <div className="flex flex-col items-center justify-center" style={{ minWidth: 120 }}>
          <span className="text-xs flex items-center gap-1" style={{ color: '#8B7355' }}>
            <Beaker size={12} />
            预估胶量
          </span>
          <span className="font-display text-xl font-bold" style={{ color: '#87CEEB' }}>
            {estimate.totalResinMl.toFixed(1)}
            <span className="text-sm font-normal ml-1" style={{ color: '#8B7355' }}>ml</span>
          </span>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-thin py-1">
          {estimate.layerDetails.map((detail) => (
            <div
              key={detail.layerId}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-1"
              style={{
                background: 'rgba(0,0,0,0.2)',
                minWidth: 100,
              }}
            >
              <span className="text-xs truncate w-full text-center" style={{ color: '#FFF8F0' }}>
                {detail.layerName}
              </span>
              <div
                className="w-full rounded-full"
                style={{ height: 6, background: 'rgba(0,0,0,0.3)' }}
              >
                <div
                  className="rounded-full"
                  style={{
                    height: '100%',
                    width: `${(detail.hours / maxLayerHours) * 100}%`,
                    background: '#C9A96E',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: '#8B7355' }}>
                {detail.hours.toFixed(1)}h · {detail.thickness}mm · {detail.resinMl.toFixed(1)}ml
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin" style={{ maxHeight: 70, minWidth: 250 }}>
          {estimate.warnings.length === 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#6B8E6B' }}>
              <Info size={14} />
              无风险提示
            </div>
          )}
          {estimate.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs rounded px-2 py-0.5"
              style={{
                color: warningColor(w.level),
                background: `${warningColor(w.level)}15`,
              }}
            >
              {warningIcon(w.type)}
              <span>{w.message}</span>
            </div>
          ))}
        </div>

        {layers.length > 0 && (
          <button
            onClick={() => setShowSteps(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all self-center"
            style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <FileText size={14} />
            制作步骤卡
          </button>
        )}
      </div>

      {showSteps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin" style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold" style={{ color: '#C9A96E' }}>制作步骤卡 · {moldShape.label}</h3>
              <button onClick={() => setShowSteps(false)} style={{ color: '#8B7355' }}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {stepCards.map((card) => (
                <div
                  key={card.stepNumber}
                  className="rounded-lg p-4"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center justify-center w-8 h-8 rounded-full font-bold"
                        style={{ background: '#C9A96E', color: '#2C1810' }}
                      >
                        {card.stepNumber}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: '#FFF8F0' }}>{card.layerName}</h4>
                        <span className="text-xs" style={{ color: '#8B7355' }}>
                          {getCategoryLabel(card.layerType)}层
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: '#87CEEB' }}>胶量: {card.resinMl.toFixed(1)}ml</div>
                      <div className="text-xs" style={{ color: '#C9A96E' }}>固化: {card.curingHours.toFixed(1)}h</div>
                      <div className="text-xs" style={{ color: '#8B7355' }}>厚度: {card.thickness}mm</div>
                    </div>
                  </div>
                  {card.elementCount > 0 && (
                    <div className="mb-2">
                      <span className="text-xs" style={{ color: '#8B7355' }}>材料 ({card.elementCount}个): </span>
                      <span className="text-xs" style={{ color: '#FFF8F0' }}>
                        {card.elementNames.join('、')}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>操作提示:</span>
                    {card.tips.map((tip, i) => (
                      <div key={i} className="text-xs flex items-start gap-1" style={{ color: '#FFF8F0' }}>
                        <span style={{ color: '#C9A96E' }}>•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg p-4 mt-4" style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#C9A96E' }}>制作总结</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div style={{ color: '#8B7355' }}>模具类型: <span style={{ color: '#FFF8F0' }}>{moldShape.label}</span></div>
                  <div style={{ color: '#8B7355' }}>总层数: <span style={{ color: '#FFF8F0' }}>{layers.length} 层</span></div>
                  <div style={{ color: '#8B7355' }}>总厚度: <span style={{ color: '#FFF8F0' }}>{layers.reduce((s, l) => s + l.thickness, 0).toFixed(1)} mm</span></div>
                  <div style={{ color: '#8B7355' }}>总胶量: <span style={{ color: '#87CEEB' }}>{estimate.totalResinMl.toFixed(1)} ml</span></div>
                  <div style={{ color: '#8B7355' }}>总固化时间: <span style={{ color: '#C9A96E' }}>{estimate.totalHours.toFixed(1)} 小时</span></div>
                  <div style={{ color: '#8B7355' }}>材料总数: <span style={{ color: '#FFF8F0' }}>{layers.reduce((s, l) => s + l.elements.length, 0)} 个</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
