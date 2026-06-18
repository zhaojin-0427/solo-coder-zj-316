import { useMemo } from 'react'
import { Lightbulb, AlertTriangle, ChevronRight, BookOpen } from 'lucide-react'
import type { SimilarCase, Layer, Stage, MoldType, KnowledgeCard, ReviewRecord } from '../types'
import { findSimilarCases, generatePrecautions } from '../utils/similarCaseMatcher'
import { getDefectLabel, getDefectIcon, getSuccessRateLabel, getSuccessRateColor } from '../utils/defectLibrary'
import { MOLD_SHAPE_MAP } from '../utils/moldShapes'

interface Props {
  moldType: MoldType
  layers: Layer[]
  stages: Stage[]
  ambientTemp: number
  knowledgeCards: KnowledgeCard[]
  reviewRecords: ReviewRecord[]
  onOpenKnowledge: () => void
  onViewCase?: (reviewId: string) => void
}

export default function SimilarCasesPanel({
  moldType,
  layers,
  stages,
  ambientTemp,
  knowledgeCards,
  reviewRecords,
  onOpenKnowledge,
  onViewCase,
}: Props) {
  const similarCases = useMemo(
    () =>
      findSimilarCases(
        { moldType, layers, stages, ambientTemp },
        knowledgeCards,
        reviewRecords,
        3
      ),
    [moldType, layers, stages, ambientTemp, knowledgeCards, reviewRecords]
  )

  const precautions = useMemo(
    () => generatePrecautions({ moldType, layers, stages, ambientTemp }, similarCases),
    [moldType, layers, stages, ambientTemp, similarCases]
  )

  const getPrecautionIcon = (type: string) => {
    switch (type) {
      case 'bubble':
        return '🫧'
      case 'fogging':
        return '🌫️'
      case 'cracking':
        return '💔'
      case 'delamination':
        return '📑'
      case 'materialDrift':
        return '🌊'
      case 'pigmentSettling':
        return '🧪'
      case 'surfaceDimple':
        return '🕳️'
      case 'yellowing':
        return '🟡'
      case 'shrinkage':
        return '📉'
      case 'thickness':
        return '📏'
      case 'temperature':
        return '🌡️'
      case 'material':
        return '🎨'
      case 'stage':
        return '⚗️'
      default:
        return '⚠️'
    }
  }

  const getSeverityColor = (severity: 'info' | 'warning' | 'danger') => {
    switch (severity) {
      case 'danger':
        return '#EF4444'
      case 'warning':
        return '#F59E0B'
      default:
        return '#60A5FA'
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ width: 260, background: '#3D2B1F', borderLeft: '1px solid rgba(201,169,110,0.2)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
        <div className="flex items-center gap-2">
          <Lightbulb size={16} style={{ color: '#C9A96E' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#C9A96E' }}>智能提醒</h3>
        </div>
        <button
          onClick={onOpenKnowledge}
          className="flex items-center gap-1 text-xs"
          style={{ color: '#8B7355' }}
        >
          <BookOpen size={12} />
          知识库
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {precautions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
              <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>
                风险提醒 ({precautions.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {precautions.map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2 text-xs"
                  style={{
                    background: `${getSeverityColor(p.severity)}10`,
                    borderLeft: `2px solid ${getSeverityColor(p.severity)}`,
                  }}
                >
                  <div className="flex items-start gap-1.5">
                    <span>{getPrecautionIcon(p.type)}</span>
                    <span style={{ color: '#FFF8F0' }}>{p.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BookOpen size={12} style={{ color: '#87CEEB' }} />
              <span className="text-xs font-medium" style={{ color: '#87CEEB' }}>
                相似案例 ({similarCases.length})
              </span>
            </div>
          </div>

          {similarCases.length === 0 && (
            <div className="text-center py-6 rounded-lg" style={{ background: 'rgba(0,0,0,0.15)', color: '#8B7355' }}>
              <BookOpen size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div className="text-xs">暂无相似案例</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.7 }}>创建复盘记录后可匹配</div>
            </div>
          )}

          {similarCases.length > 0 && (
            <div className="space-y-2">
              {similarCases.map((sc) => (
                <div
                  key={sc.knowledgeCard.id}
                  className="rounded-lg p-2.5 cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}
                  onClick={() => onViewCase?.(sc.knowledgeCard.reviewId)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium truncate" style={{ color: '#FFF8F0' }}>
                      {sc.knowledgeCard.schemeName}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${getSuccessRateColor(sc.knowledgeCard.successRate)}20`,
                        color: getSuccessRateColor(sc.knowledgeCard.successRate),
                      }}
                    >
                      {getSuccessRateLabel(sc.knowledgeCard.successRate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: '#8B7355' }}>
                    <span>{MOLD_SHAPE_MAP[sc.knowledgeCard.moldType]?.label}</span>
                    <span>·</span>
                    <span>{sc.knowledgeCard.totalThickness.toFixed(1)}mm</span>
                    <span>·</span>
                    <span>{sc.knowledgeCard.avgTemp.toFixed(0)}°C</span>
                  </div>

                  {sc.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {sc.matchReasons.slice(0, 2).map((reason, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(135,206,235,0.15)', color: '#87CEEB' }}>
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {sc.suggestedMeasures.length > 0 && (
                    <div className="pt-1.5" style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                      <div className="flex items-start gap-1">
                        <Lightbulb size={10} style={{ color: '#F59E0B', marginTop: 1 }} />
                        <span className="text-xs" style={{ color: '#F59E0B' }}>
                          {sc.suggestedMeasures[0]}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs flex items-center gap-0.5" style={{ color: '#8B7355' }}>
                      查看详情 <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {similarCases.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} style={{ color: '#6B8E6B' }} />
              <span className="text-xs font-medium" style={{ color: '#6B8E6B' }}>
                推荐规避措施
              </span>
            </div>
            <div className="space-y-1.5">
              {Array.from(new Set(similarCases.flatMap((sc) => sc.suggestedMeasures)))
                .slice(0, 5)
                .map((measure, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs p-2 rounded" style={{ background: 'rgba(107,142,107,0.08)', color: '#FFF8F0' }}>
                    <span style={{ color: '#6B8E6B' }}>✓</span>
                    <span>{measure}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
