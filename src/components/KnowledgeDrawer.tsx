import { useState, useMemo } from 'react'
import { X, Search, Filter, BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { KnowledgeCard, ReviewRecord, MoldType, MaterialCategory, DefectType, SuccessRate } from '../types'
import {
  getDefectLabel,
  getDefectIcon,
  getSuccessRateLabel,
  getSuccessRateColor,
  getMaterialCategoryLabel,
  TEMP_RANGES,
  DEFECT_LIBRARY,
  DEFOAMING_METHODS,
} from '../utils/defectLibrary'
import { filterKnowledgeCards } from '../utils/similarCaseMatcher'
import { MOLD_SHAPE_MAP } from '../utils/moldShapes'

interface Props {
  open: boolean
  onClose: () => void
  knowledgeCards: KnowledgeCard[]
  reviewRecords: ReviewRecord[]
  onViewReview?: (reviewId: string) => void
}

export default function KnowledgeDrawer({ open, onClose, knowledgeCards, reviewRecords, onViewReview }: Props) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMoldTypes, setSelectedMoldTypes] = useState<MoldType[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialCategory[]>([])
  const [selectedDefects, setSelectedDefects] = useState<DefectType[]>([])
  const [selectedSuccessRates, setSelectedSuccessRates] = useState<SuccessRate[]>([])
  const [selectedTempRange, setSelectedTempRange] = useState<number | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  const filteredCards = useMemo(() => {
    const tempRange = selectedTempRange !== null ? [TEMP_RANGES[selectedTempRange].min, TEMP_RANGES[selectedTempRange].max] as [number, number] : null
    return filterKnowledgeCards(knowledgeCards, reviewRecords, {
      moldTypes: selectedMoldTypes.length > 0 ? selectedMoldTypes : undefined,
      materialCategories: selectedMaterials.length > 0 ? selectedMaterials : undefined,
      defectTypes: selectedDefects.length > 0 ? selectedDefects : undefined,
      tempRange,
      successRates: selectedSuccessRates.length > 0 ? selectedSuccessRates : undefined,
      keyword: searchKeyword || undefined,
    })
  }, [knowledgeCards, reviewRecords, searchKeyword, selectedMoldTypes, selectedMaterials, selectedDefects, selectedSuccessRates, selectedTempRange])

  const toggleMoldType = (type: MoldType) => {
    setSelectedMoldTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleMaterial = (cat: MaterialCategory) => {
    setSelectedMaterials((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleDefect = (defect: DefectType) => {
    setSelectedDefects((prev) =>
      prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]
    )
  }

  const toggleSuccessRate = (rate: SuccessRate) => {
    setSelectedSuccessRates((prev) =>
      prev.includes(rate) ? prev.filter((r) => r !== rate) : [...prev, rate]
    )
  }

  const clearFilters = () => {
    setSelectedMoldTypes([])
    setSelectedMaterials([])
    setSelectedDefects([])
    setSelectedSuccessRates([])
    setSelectedTempRange(null)
    setSearchKeyword('')
  }

  const getReview = (reviewId: string) => reviewRecords.find((r) => r.id === reviewId)

  if (!open) return null

  const moldTypes: MoldType[] = ['pendant', 'hairclip', 'ring', 'coaster']
  const materialCats: MaterialCategory[] = ['driedFlower', 'glitter', 'goldFoil', 'colorPowder']
  const defectTypes: DefectType[] = ['bubble', 'fogging', 'cracking', 'delamination', 'materialDrift', 'pigmentSettling', 'surfaceDimple', 'yellowing', 'shrinkage', 'other']
  const successRates: SuccessRate[] = ['perfect', 'good', 'average', 'poor', 'failed']

  const activeFilterCount =
    selectedMoldTypes.length +
    selectedMaterials.length +
    selectedDefects.length +
    selectedSuccessRates.length +
    (selectedTempRange !== null ? 1 : 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="h-full w-full max-w-md flex flex-col"
        style={{ background: '#3D2B1F', borderLeft: '1px solid rgba(201,169,110,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: '#C9A96E' }} />
            <h2 className="font-display text-base font-bold" style={{ color: '#C9A96E' }}>
              配方知识库
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E' }}>
              {filteredCards.length} 条
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#8B7355' }}>
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          <div className="relative">
            <Search size={14} style={{ color: '#8B7355', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索方案名、缺陷、改进建议..."
              className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: showFilters || activeFilterCount > 0 ? 'rgba(201,169,110,0.2)' : 'rgba(0,0,0,0.2)',
                color: showFilters || activeFilterCount > 0 ? '#C9A96E' : '#8B7355',
              }}
            >
              <Filter size={12} />
              筛选
              {activeFilterCount > 0 && (
                <span className="px-1.5 rounded-full text-xs" style={{ background: 'rgba(201,169,110,0.3)' }}>
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs" style={{ color: '#8B7355' }}>
                清除筛选
              </button>
            )}
          </div>

          {showFilters && (
            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}>
              <div>
                <div className="text-xs mb-1.5" style={{ color: '#8B7355' }}>模具类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {moldTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleMoldType(type)}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: selectedMoldTypes.includes(type) ? 'rgba(201,169,110,0.25)' : 'rgba(0,0,0,0.2)',
                        color: selectedMoldTypes.includes(type) ? '#C9A96E' : '#8B7355',
                        border: `1px solid ${selectedMoldTypes.includes(type) ? 'rgba(201,169,110,0.4)' : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      {MOLD_SHAPE_MAP[type]?.label || type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-1.5" style={{ color: '#8B7355' }}>材料类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {materialCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleMaterial(cat)}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: selectedMaterials.includes(cat) ? 'rgba(135,206,235,0.2)' : 'rgba(0,0,0,0.2)',
                        color: selectedMaterials.includes(cat) ? '#87CEEB' : '#8B7355',
                        border: `1px solid ${selectedMaterials.includes(cat) ? 'rgba(135,206,235,0.4)' : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      {getMaterialCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-1.5" style={{ color: '#8B7355' }}>缺陷类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {defectTypes.map((defect) => (
                    <button
                      key={defect}
                      onClick={() => toggleDefect(defect)}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: selectedDefects.includes(defect) ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.2)',
                        color: selectedDefects.includes(defect) ? '#EF4444' : '#8B7355',
                        border: `1px solid ${selectedDefects.includes(defect) ? 'rgba(239,68,68,0.4)' : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      {getDefectIcon(defect)} {getDefectLabel(defect)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-1.5" style={{ color: '#8B7355' }}>成功率</div>
                <div className="flex flex-wrap gap-1.5">
                  {successRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => toggleSuccessRate(rate)}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: selectedSuccessRates.includes(rate) ? `${getSuccessRateColor(rate)}20` : 'rgba(0,0,0,0.2)',
                        color: selectedSuccessRates.includes(rate) ? getSuccessRateColor(rate) : '#8B7355',
                        border: `1px solid ${selectedSuccessRates.includes(rate) ? `${getSuccessRateColor(rate)}50` : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      {getSuccessRateLabel(rate)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-1.5" style={{ color: '#8B7355' }}>温度区间</div>
                <div className="flex flex-wrap gap-1.5">
                  {TEMP_RANGES.map((range, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTempRange(selectedTempRange === i ? null : i)}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: selectedTempRange === i ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.2)',
                        color: selectedTempRange === i ? '#F59E0B' : '#8B7355',
                        border: `1px solid ${selectedTempRange === i ? 'rgba(245,158,11,0.4)' : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {filteredCards.length === 0 && (
            <div className="text-center py-12" style={{ color: '#8B7355' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div className="text-sm">暂无配方知识卡片</div>
              <div className="text-xs mt-1">保存方案后创建复盘记录，即可自动生成知识卡片</div>
            </div>
          )}

          {filteredCards.map((card) => {
            const review = getReview(card.reviewId)
            const isExpanded = expandedCardId === card.id
            return (
              <div
                key={card.id}
                className="rounded-lg overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.15)' }}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1" style={{ color: '#FFF8F0' }}>
                        {card.schemeName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#8B7355' }}>
                        <span>{MOLD_SHAPE_MAP[card.moldType]?.label || card.moldType}</span>
                        <span>·</span>
                        <span>{card.totalThickness.toFixed(1)}mm</span>
                        <span>·</span>
                        <span>{card.avgTemp.toFixed(0)}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${getSuccessRateColor(card.successRate)}20`,
                          color: getSuccessRateColor(card.successRate),
                        }}
                      >
                        {getSuccessRateLabel(card.successRate)}
                      </span>
                      {isExpanded ? <ChevronUp size={14} style={{ color: '#8B7355' }} /> : <ChevronDown size={14} style={{ color: '#8B7355' }} />}
                    </div>
                  </div>

                  {card.defects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.defects.slice(0, 3).map((d) => (
                        <span key={d} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                          {getDefectIcon(d)} {getDefectLabel(d)}
                        </span>
                      ))}
                      {card.defects.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#8B7355' }}>
                          +{card.defects.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && review && (
                  <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}>
                    <div className="pt-2">
                      <div className="text-xs mb-1.5 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                        <Info size={12} />
                        成品状态
                      </div>
                      <p className="text-xs" style={{ color: '#FFF8F0' }}>
                        {review.actualStatus || '无描述'}
                      </p>
                    </div>

                    {review.defects.length > 0 && (
                      <div>
                        <div className="text-xs mb-1.5" style={{ color: '#EF4444' }}>缺陷详情</div>
                        <div className="space-y-1.5">
                          {review.defects.map((d) => (
                            <div key={d.type} className="text-xs p-2 rounded" style={{ background: 'rgba(239,68,68,0.08)' }}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span>{getDefectIcon(d.type)}</span>
                                <span style={{ color: '#EF4444', fontWeight: 500 }}>{getDefectLabel(d.type)}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{
                                  background: d.severity === 'severe' ? 'rgba(239,68,68,0.2)' : d.severity === 'moderate' ? 'rgba(245,158,11,0.2)' : 'rgba(107,142,107,0.2)',
                                  color: d.severity === 'severe' ? '#EF4444' : d.severity === 'moderate' ? '#F59E0B' : '#6B8E6B',
                                }}>
                                  {d.severity === 'mild' ? '轻微' : d.severity === 'moderate' ? '中等' : '严重'}
                                </span>
                              </div>
                              {d.description && <p style={{ color: '#8B7355' }}>{d.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {card.improvements && (
                      <div>
                        <div className="text-xs mb-1.5" style={{ color: '#6B8E6B' }}>改进建议</div>
                        <p className="text-xs p-2 rounded" style={{ background: 'rgba(107,142,107,0.08)', color: '#FFF8F0' }}>
                          {card.improvements}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#8B7355' }}>固化耗时</div>
                        <div style={{ color: '#C9A96E' }}>{card.actualCuringHours.toFixed(1)}h</div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#8B7355' }}>消泡方式</div>
                        <div style={{ color: '#87CEEB' }}>{DEFOAMING_METHODS[card.defoamingMethod]?.label || card.defoamingMethod}</div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#8B7355' }}>AB胶比例</div>
                        <div style={{ color: '#F59E0B' }}>{review.abRatio || '未知'}</div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#8B7355' }}>脱模时间</div>
                        <div style={{ color: '#C9A96E' }}>{review.demoldTime}h</div>
                      </div>
                    </div>

                    {onViewReview && (
                      <button
                        onClick={() => onViewReview(card.reviewId)}
                        className="w-full py-1.5 rounded text-xs"
                        style={{ background: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}
                      >
                        查看完整复盘记录
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
