import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { X, GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import {
  compareSchemes,
  getCategoryLabel,
  getStageLabel,
  getRiskLabel,
  getRiskColor,
} from '@/utils/curingCalculator'
import type { SchemeComparison as SchemeComparisonType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

function DiffBadge({ value, unit }: { value: number; unit?: string }) {
  if (Math.abs(value) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,115,85,0.2)', color: '#8B7355' }}>
        <Minus size={10} />
        {value.toFixed(1)}{unit || ''}
      </span>
    )
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
        <TrendingUp size={10} />
        +{value.toFixed(1)}{unit || ''}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(107,142,107,0.2)', color: '#6B8E6B' }}>
      <TrendingDown size={10} />
      {value.toFixed(1)}{unit || ''}
    </span>
  )
}

export default function SchemeComparison({ open, onClose }: Props) {
  const schemes = useStore((s) => s.schemes)
  const [schemeAId, setSchemeAId] = useState<string | null>(null)
  const [schemeBId, setSchemeBId] = useState<string | null>(null)

  const comparison = useMemo<SchemeComparisonType | null>(() => {
    if (!schemeAId || !schemeBId) return null
    const a = schemes.find((s) => s.id === schemeAId)
    const b = schemes.find((s) => s.id === schemeBId)
    if (!a || !b) return null
    return compareSchemes(a, b)
  }, [schemeAId, schemeBId, schemes])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto scrollbar-thin fade-in"
        style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitCompare size={18} style={{ color: '#C9A96E' }} />
            <h3 className="font-display text-lg font-bold" style={{ color: '#C9A96E' }}>
              方案对比
            </h3>
          </div>
          <button onClick={onClose} style={{ color: '#8B7355' }}>
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-11 gap-3 mb-5 items-center">
          <div className="col-span-5">
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>方案 A</label>
            <select
              value={schemeAId || ''}
              onChange={(e) => setSchemeAId(e.target.value || null)}
              className="w-full text-sm rounded-lg px-3 py-2 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              <option value="">选择方案...</option>
              {schemes
                .filter((s) => s.id !== schemeBId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-span-1 flex justify-center">
            <ArrowRight size={20} style={{ color: '#C9A96E' }} />
          </div>
          <div className="col-span-5">
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>方案 B</label>
            <select
              value={schemeBId || ''}
              onChange={(e) => setSchemeBId(e.target.value || null)}
              className="w-full text-sm rounded-lg px-3 py-2 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              <option value="">选择方案...</option>
              {schemes
                .filter((s) => s.id !== schemeAId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {!comparison && (
          <div className="text-center py-12" style={{ color: '#8B7355' }}>
            <GitCompare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div className="text-sm">请选择两个方案进行对比</div>
          </div>
        )}

        {comparison && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div className="text-xs mb-1" style={{ color: '#8B7355' }}>总胶量差异</div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold" style={{ color: '#87CEEB' }}>
                    {comparison.totalResinDiff > 0 ? '+' : ''}
                    {comparison.totalResinDiff.toFixed(1)}
                    <span className="text-xs font-normal ml-0.5" style={{ color: '#8B7355' }}>ml</span>
                  </span>
                  <DiffBadge value={comparison.totalResinDiff} unit="ml" />
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div className="text-xs mb-1" style={{ color: '#8B7355' }}>总固化差异</div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold" style={{ color: '#C9A96E' }}>
                    {comparison.totalHoursDiff > 0 ? '+' : ''}
                    {comparison.totalHoursDiff.toFixed(1)}
                    <span className="text-xs font-normal ml-0.5" style={{ color: '#8B7355' }}>h</span>
                  </span>
                  <DiffBadge value={comparison.totalHoursDiff} unit="h" />
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div className="text-xs mb-1" style={{ color: '#8B7355' }}>总厚度差异</div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold" style={{ color: '#F59E0B' }}>
                    {comparison.totalThicknessDiff > 0 ? '+' : ''}
                    {comparison.totalThicknessDiff.toFixed(1)}
                    <span className="text-xs font-normal ml-0.5" style={{ color: '#8B7355' }}>mm</span>
                  </span>
                  <DiffBadge value={comparison.totalThicknessDiff} unit="mm" />
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div className="text-xs mb-1" style={{ color: '#8B7355' }}>整体风险</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: getRiskColor(comparison.riskDiff.levelA) }}>
                      {getRiskLabel(comparison.riskDiff.levelA)}
                    </span>
                    <ArrowRight size={12} style={{ color: '#8B7355' }} />
                    <span className="text-xs" style={{ color: getRiskColor(comparison.riskDiff.levelB) }}>
                      {getRiskLabel(comparison.riskDiff.levelB)}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#8B7355' }}>
                    {comparison.riskDiff.countA} → {comparison.riskDiff.countB} 风险点
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: '#C9A96E' }}>
                材料使用差异
              </div>
              <div className="grid grid-cols-4 gap-3">
                {comparison.totalMaterialDiff.map((m) => (
                  <div key={m.category} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#8B7355' }}>
                      {getCategoryLabel(m.category)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#FFF8F0' }}>
                        {m.countA} → {m.countB}
                      </span>
                      <DiffBadge value={m.diff} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.15)' }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: '#C9A96E' }}>
                分阶段对比
              </div>
              <div className="space-y-2">
                {comparison.stageComparisons.map((sc, i) => (
                  <div
                    key={i}
                    className="rounded p-2"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: '#FFF8F0' }}>
                          {sc.stageName}
                        </span>
                        <span className="text-xs" style={{ color: '#8B7355' }}>
                          {getStageLabel(sc.stageType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DiffBadge value={sc.resinDiff} unit="ml" />
                        <DiffBadge value={sc.hoursDiff} unit="h" />
                        <DiffBadge value={sc.thicknessDiff} unit="mm" />
                        {sc.tempDiff !== 0 && (
                          <span className="text-xs" style={{ color: '#EF4444' }}>
                            {sc.tempDiff > 0 ? '+' : ''}{sc.tempDiff}°C
                          </span>
                        )}
                      </div>
                    </div>
                    {(sc.risksA.length > 0 || sc.risksB.length > 0) && (
                      <div className="flex gap-3 text-xs mt-1">
                        {sc.risksA.length > 0 && (
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-0.5" style={{ color: '#8B7355' }}>
                              <AlertTriangle size={10} />
                              A 风险
                            </div>
                            {sc.risksA.map((r, j) => (
                              <div key={j} style={{ color: '#F59E0B' }}>• {r}</div>
                            ))}
                          </div>
                        )}
                        {sc.risksB.length > 0 && (
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-0.5" style={{ color: '#8B7355' }}>
                              <AlertTriangle size={10} />
                              B 风险
                            </div>
                            {sc.risksB.map((r, j) => (
                              <div key={j} style={{ color: '#EF4444' }}>• {r}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs" style={{ color: '#8B7355' }}>
              ※ 正值表示方案 B 相比方案 A 的增量，负值表示方案 B 减少的量
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
