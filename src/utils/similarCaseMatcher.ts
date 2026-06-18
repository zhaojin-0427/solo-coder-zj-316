import type {
  SimilarCase,
  KnowledgeCard,
  ReviewRecord,
  Layer,
  Stage,
  MoldType,
  MaterialCategory,
  DefectType,
} from '../types'
import { DEFECT_LIBRARY } from './defectLibrary'

interface MatchContext {
  moldType: MoldType
  layers: Layer[]
  stages: Stage[]
  ambientTemp: number
}

export function findSimilarCases(
  context: MatchContext,
  knowledgeCards: KnowledgeCard[],
  reviewRecords: ReviewRecord[],
  limit: number = 5
): SimilarCase[] {
  const { moldType, layers, stages, ambientTemp } = context

  const totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0)
  const materialCategories = [...new Set(layers.map((l) => l.type))]
  const hasGlitter = materialCategories.includes('glitter') || materialCategories.includes('goldFoil')
  const hasColorPowder = materialCategories.includes('colorPowder')
  const hasDriedFlower = materialCategories.includes('driedFlower')

  const results: SimilarCase[] = []

  for (const card of knowledgeCards) {
    let score = 0
    const reasons: string[] = []
    const measures: string[] = []

    if (card.moldType === moldType) {
      score += 30
      reasons.push('相同模具类型')
    }

    const thicknessDiff = Math.abs(card.totalThickness - totalThickness)
    if (thicknessDiff <= 0.5) {
      score += 25
      reasons.push('厚度相近')
    } else if (thicknessDiff <= 1.5) {
      score += 15
      reasons.push('厚度接近')
    }

    const tempDiff = Math.abs(card.avgTemp - ambientTemp)
    if (tempDiff <= 3) {
      score += 20
      reasons.push('温度相近')
    } else if (tempDiff <= 8) {
      score += 10
      reasons.push('温度接近')
    }

    const commonCategories = card.materialCategories.filter((c) => materialCategories.includes(c))
    if (commonCategories.length > 0) {
      score += commonCategories.length * 10
      reasons.push(`包含相同材料: ${commonCategories.length}种`)
    }

    if (card.defects.length > 0) {
      score += 5
    }

    if (score >= 15) {
      const review = reviewRecords.find((r) => r.id === card.reviewId)
      if (review) {
        if (card.defects.includes('bubble') && hasGlitter) {
          measures.push('亮片/金箔密集方案易产生气泡，建议缓慢倒入并充分消泡')
          score += 10
        }
        if (card.defects.includes('fogging') && ambientTemp < 20) {
          measures.push('低温环境下易出现发雾，建议使用加热垫保持温度')
          score += 10
        }
        if (card.defects.includes('cracking') && totalThickness > 3) {
          measures.push('厚度较大易开裂，建议分多次薄层浇筑')
          score += 10
        }
        if (card.defects.includes('materialDrift') && hasDriedFlower) {
          measures.push('干花材料易漂移，建议先刷薄层胶固定')
          score += 5
        }
        if (card.defects.includes('pigmentSettling') && hasColorPowder) {
          measures.push('色粉易沉淀，需先与少量胶液预混合')
          score += 5
        }

        if (card.improvements) {
          const imps = card.improvements.split(/[，。；\n]+/).filter((s) => s.trim().length > 0)
          measures.push(...imps.slice(0, 2))
        }

        results.push({
          knowledgeCard: card,
          reviewRecord: review,
          matchScore: score,
          matchReasons: reasons,
          suggestedMeasures: [...new Set(measures)],
        })
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore)
  return results.slice(0, limit)
}

export function generatePrecautions(
  context: MatchContext,
  similarCases: SimilarCase[]
): { type: string; message: string; severity: 'info' | 'warning' | 'danger' }[] {
  const { layers, ambientTemp, stages } = context
  const totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0)
  const materialCategories = [...new Set(layers.map((l) => l.type))]

  const precautions: { type: string; message: string; severity: 'info' | 'warning' | 'danger' }[] = []

  const defectStats: Record<DefectType, number> = {} as Record<DefectType, number>
  for (const sc of similarCases) {
    for (const defect of sc.knowledgeCard.defects) {
      defectStats[defect] = (defectStats[defect] || 0) + 1
    }
  }

  const sortedDefects = Object.entries(defectStats).sort((a, b) => b[1] - a[1]) as [DefectType, number][]

  for (const [defectType, count] of sortedDefects) {
    if (count >= 2) {
      const defectInfo = DEFECT_LIBRARY[defectType]
      if (defectInfo) {
        const prevention = defectInfo.preventionMethods[0]
        precautions.push({
          type: defectType,
          message: `相似案例中${count}例出现${defectInfo.label}，${prevention}`,
          severity: count >= 3 ? 'warning' : 'info',
        })
      }
    }
  }

  if (totalThickness > 3) {
    precautions.push({
      type: 'thickness',
      message: `总厚度 ${totalThickness.toFixed(1)}mm 较大，建议分多次薄层浇筑，避免放热开裂`,
      severity: 'warning',
    })
  }

  if (ambientTemp < 15) {
    precautions.push({
      type: 'temperature',
      message: `环境温度 ${ambientTemp}°C 偏低，固化速度减慢且易发雾，建议加热保温`,
      severity: 'warning',
    })
  }

  if (ambientTemp > 32) {
    precautions.push({
      type: 'temperature',
      message: `环境温度 ${ambientTemp}°C 偏高，放热过快可能导致开裂，建议降温`,
      severity: 'warning',
    })
  }

  if (materialCategories.includes('glitter') || materialCategories.includes('goldFoil')) {
    precautions.push({
      type: 'material',
      message: '含亮片/金箔材料，气泡风险较高，建议充分消泡',
      severity: 'info',
    })
  }

  if (materialCategories.includes('colorPowder')) {
    precautions.push({
      type: 'material',
      message: '含色粉材料，注意色粉沉淀，需预混合均匀',
      severity: 'info',
    })
  }

  const maxStageThickness = Math.max(...stages.map((s) => s.thickness), 0)
  if (maxStageThickness > 3) {
    precautions.push({
      type: 'stage',
      message: `存在厚度 ${maxStageThickness}mm 的阶段，放热风险高，建议分层浇筑`,
      severity: 'danger',
    })
  }

  return precautions
}

export function filterKnowledgeCards(
  cards: KnowledgeCard[],
  reviews: ReviewRecord[],
  filter: {
    moldTypes?: MoldType[]
    materialCategories?: MaterialCategory[]
    defectTypes?: DefectType[]
    tempRange?: [number, number] | null
    successRates?: string[]
    keyword?: string
  }
): KnowledgeCard[] {
  return cards.filter((card) => {
    if (filter.moldTypes && filter.moldTypes.length > 0 && !filter.moldTypes.includes(card.moldType)) {
      return false
    }

    if (
      filter.materialCategories &&
      filter.materialCategories.length > 0 &&
      !filter.materialCategories.some((c) => card.materialCategories.includes(c))
    ) {
      return false
    }

    if (
      filter.defectTypes &&
      filter.defectTypes.length > 0 &&
      !filter.defectTypes.some((d) => card.defects.includes(d))
    ) {
      return false
    }

    if (filter.tempRange) {
      const [min, max] = filter.tempRange
      if (card.avgTemp < min || card.avgTemp > max) {
        return false
      }
    }

    if (filter.successRates && filter.successRates.length > 0 && !filter.successRates.includes(card.successRate)) {
      return false
    }

    if (filter.keyword && filter.keyword.trim()) {
      const keyword = filter.keyword.toLowerCase()
      const review = reviews.find((r) => r.id === card.reviewId)
      const textToSearch = [
        card.schemeName,
        card.improvements,
        review?.actualStatus,
        review?.photoNotes,
        ...card.defects,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!textToSearch.includes(keyword)) {
        return false
      }
    }

    return true
  })
}
