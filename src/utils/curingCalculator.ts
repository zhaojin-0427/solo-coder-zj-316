import type {
  Layer,
  CuringEstimate,
  LayerCuringInfo,
  Warning,
  MoldType,
  MaterialElement,
  StepCardItem,
  MaterialCategory,
  Stage,
  StageCuringInfo,
  StageType,
  RiskLevel,
  Scheme,
  SchemeComparison,
  StageComparisonData,
} from '../types'
import { MOLD_SHAPE_MAP } from './moldShapes'

const BASE_CURE_HOURS_PER_MM = 10
const RESIN_ML_PER_MM2_PER_MM = 0.001
const OPTIMAL_TEMP = 25

const CATEGORY_TIPS: Record<MaterialCategory, string[]> = {
  driedFlower: ['干花需提前脱水处理', '放置时轻压避免气泡', '建议先刷薄层胶固定'],
  glitter: ['亮片易产生气泡，缓慢倒入', '可分层撒布增加层次感', '注意避免金属亮片氧化'],
  goldFoil: ['金箔极薄，用镊子轻取', '避免褶皱影响美观', '可撕成碎片增加自然感'],
  colorPowder: ['色粉需与少量胶预混合', '避免色粉结块', '少量多次调色更均匀'],
}

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  driedFlower: '干花',
  glitter: '亮片',
  goldFoil: '金箔',
  colorPowder: '色粉',
}

const STAGE_LABELS: Record<StageType, string> = {
  base: '底胶层',
  material: '材料定位层',
  sealant: '封胶层',
  correction: '补胶修正层',
}

const STAGE_TYPE_ORDER: StageType[] = ['base', 'material', 'sealant', 'correction']

function tempFactor(temp: number): number {
  const diff = temp - OPTIMAL_TEMP
  if (diff >= 0) {
    return Math.max(0.7, 1 - diff * 0.03)
  }
  return 1 + Math.abs(diff) * 0.05
}

function calculateCuringTime(layers: Layer[], moldAreaMm2: number, ambientTemp: number): LayerCuringInfo[] {
  return layers.map((layer) => {
    let hours = layer.thickness * BASE_CURE_HOURS_PER_MM * tempFactor(ambientTemp)
    if (layer.type === 'colorPowder') {
      hours *= 1.1
    }
    if (layer.elements.length > 5) {
      hours *= 1.05
    }
    const resinMl = Math.round(moldAreaMm2 * layer.thickness * RESIN_ML_PER_MM2_PER_MM * 100) / 100
    return {
      layerId: layer.id,
      layerName: layer.name,
      hours: Math.round(hours * 100) / 100,
      thickness: layer.thickness,
      resinMl,
    }
  })
}

function assessStageRisk(
  stage: Stage,
  stageLayers: Layer[],
  _moldAreaMm2: number
): { level: RiskLevel; messages: string[]; suggestions: string[] } {
  const messages: string[] = []
  const suggestions: string[] = []
  let riskScore = 0

  if (stage.ambientTemp < 15) {
    messages.push(`环境温度 ${stage.ambientTemp}°C 偏低，固化速度显著减慢`)
    riskScore += 2
    suggestions.push('建议使用加热垫或放在温暖处，温度保持在 20-28°C')
  } else if (stage.ambientTemp > 32) {
    messages.push(`环境温度 ${stage.ambientTemp}°C 偏高，可能产生放热过快`)
    riskScore += 2
    suggestions.push('建议降低环境温度，避免阳光直射会导致固化不均')
  } else if (stage.ambientTemp < 20 || stage.ambientTemp > 28) {
    messages.push(`环境温度 ${stage.ambientTemp}°C 偏离最佳区间`)
    riskScore += 1
  }

  if (stage.thickness > 3) {
    messages.push(`厚度 ${stage.thickness}mm 过厚，内部放热风险高`)
    riskScore += 2
    suggestions.push('建议分多次薄层浇筑，避免集中放热导致开裂')
  } else if (stage.thickness < 0.3) {
    messages.push(`厚度 ${stage.thickness}mm 过薄`)
    riskScore += 1
  }

  const elemCount = stageLayers.reduce((sum, l) => sum + l.elements.length, 0)
  if (elemCount > 8) {
    messages.push(`材料元素过多 (${elemCount}个)，气泡风险增加`)
    riskScore += 1
    suggestions.push('建议分多次薄层放置材料后静置消泡')
  }

  const hasGlitter = stageLayers.some((l) => l.type === 'glitter' || l.type === 'goldFoil')
  if (hasGlitter) {
    messages.push('含亮片/金箔材料，气泡风险较高')
    riskScore += 1
  }

  if (stage.type === 'correction' && stageLayers.length > 0) {
    suggestions.push('补胶前需清洁表面，确保结合牢固')
  }
  if (stage.type === 'material') {
    suggestions.push('材料放置后轻压固定，避免移位')
  }
  if (stage.type === 'sealant') {
    suggestions.push('封胶前检查表面平整度')
  }
  if (suggestions.length === 0) {
    suggestions.push('按标准流程操作，注意观察')
  }

  const level: RiskLevel = riskScore === 0 ? 'low' : riskScore <= 2 ? 'medium' : 'high'
  return { level, messages, suggestions }
}

function calculateStageCuring(
  stages: Stage[],
  layers: Layer[],
  moldAreaMm2: number
): StageCuringInfo[] {
  return stages.map((stage) => {
    const stageLayers = layers.filter((l) => stage.layerIds.includes(l.id))
    const layerThickness = stageLayers.reduce((s, l) => s + l.thickness, 0)
    const effectiveThickness = Math.max(stage.thickness, layerThickness)
    const resinMl =
      stage.glueMl > 0
        ? stage.glueMl
        : Math.round(moldAreaMm2 * effectiveThickness * RESIN_ML_PER_MM2_PER_MM * 100) / 100
    let hours = stage.waitHours > 0
      ? stage.waitHours
      : effectiveThickness * BASE_CURE_HOURS_PER_MM * tempFactor(stage.ambientTemp)

    const { level, messages, suggestions } = assessStageRisk(stage, stageLayers, moldAreaMm2)
    return {
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.type,
      hours: Math.round(hours * 100) / 100,
      thickness: effectiveThickness,
      resinMl,
      ambientTemp: stage.ambientTemp,
      riskLevel: level,
      riskMessages: messages,
      suggestions,
    }
  })
}

function elementsOverlap(a: MaterialElement, b: MaterialElement): boolean {
  const aLeft = a.x
  const aRight = a.x + a.width * a.scale
  const aTop = a.y
  const aBottom = a.y + a.height * a.scale
  const bLeft = b.x
  const bRight = b.x + b.width * b.scale
  const bTop = b.y
  const bBottom = b.y + b.height * b.scale
  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop
}

function detectOcclusionWarnings(layers: Layer[]): Warning[] {
  const warnings: Warning[] = []
  const allElements = layers.flatMap((layer) => layer.elements)
  for (let i = 0; i < allElements.length; i++) {
    for (let j = i + 1; j < allElements.length; j++) {
      if (elementsOverlap(allElements[i], allElements[j])) {
        warnings.push({
          type: 'occlusion',
          level: 'warning',
          message: `元素 "${allElements[i].name}" 与 "${allElements[j].name}" 存在重叠`,
          layerId: allElements[i].layerId,
        })
      }
    }
  }
  return warnings
}

function detectBubbleWarnings(layers: Layer[]): Warning[] {
  const warnings: Warning[] = []
  for (const layer of layers) {
    if (layer.type === 'glitter' || layer.type === 'goldFoil') {
      warnings.push({
        type: 'bubble',
        level: 'warning',
        message: `"${layer.name}" 层使用${layer.type === 'glitter' ? '亮片' : '金箔'}材料，气泡风险较高`,
        layerId: layer.id,
      })
    } else if (layer.type === 'driedFlower') {
      warnings.push({
        type: 'bubble',
        level: 'info',
        message: `"${layer.name}" 层使用干花材料，可能有轻微气泡`,
        layerId: layer.id,
      })
    }
  }
  return warnings
}

function detectGravityWarnings(
  layers: Layer[],
  moldType: MoldType,
  moldWidth: number,
  moldHeight: number
): Warning[] {
  const warnings: Warning[] = []
  const allElements = layers.flatMap((layer) => layer.elements)
  if (allElements.length === 0) return warnings

  let totalMass = 0
  let weightedX = 0
  let weightedY = 0

  for (const el of allElements) {
    const mass = (el.width * el.scale) * (el.height * el.scale)
    const cx = el.x
    const cy = el.y
    totalMass += mass
    weightedX += cx * mass
    weightedY += cy * mass
  }

  const centerX = weightedX / totalMass
  const centerY = weightedY / totalMass
  const distance = Math.sqrt(centerX ** 2 + centerY ** 2)

  if (moldType === 'ring') {
    const outerR = Math.min(moldWidth, moldHeight) * 0.4
    const innerR = Math.min(moldWidth, moldHeight) * 0.25
    const idealR = (outerR + innerR) / 2
    const deviation = Math.abs(distance - idealR)
    const allowDeviation = (outerR - innerR) * 0.6
    if (deviation > allowDeviation) {
      warnings.push({
        type: 'gravity',
        level: 'warning',
        message: distance < innerR
          ? '元素过于靠近戒指中心，可能位于空心区域'
          : '元素过于偏离戒指环带，分布不均匀',
      })
    }
  } else {
    const halfW = moldWidth / 2
    const halfH = moldHeight / 2
    const threshold = Math.min(halfW, halfH) * 0.35
    if (distance > threshold) {
      warnings.push({
        type: 'gravity',
        level: 'warning',
        message: '元素重心偏离模具中心过远，可能导致材料分布不均',
      })
    }
  }

  return warnings
}

function getOverallRisk(stageDetails: StageCuringInfo[], warnings: Warning[]): RiskLevel {
  let score = 0
  for (const sd of stageDetails) {
    if (sd.riskLevel === 'high') score += 2
    else if (sd.riskLevel === 'medium') score += 1
  }
  score += warnings.filter((w) => w.level === 'danger').length * 2
  score += warnings.filter((w) => w.level === 'warning').length
  return score === 0 ? 'low' : score <= 3 ? 'medium' : 'high'
}

function generateNextSuggestion(stages: Stage[], stageDetails: StageCuringInfo[]): string {
  if (stages.length === 0) return '请添加制作阶段'
  const firstHigh = stageDetails.find((s) => s.riskLevel === 'high')
  if (firstHigh) {
    return `注意：${firstHigh.stageName}风险较高，${firstHigh.suggestions[0] || '请谨慎操作'}`
  }
  const first = stageDetails[0]
  if (first) {
    return `下一步：开始${first.stageName}：${first.suggestions[0] || '按流程准备材料和胶液'}`
  }
  return '按制作流程依次进行'
}

export function estimateCuring(
  layers: Layer[],
  moldType: MoldType,
  moldWidth: number,
  moldHeight: number,
  moldAreaMm2: number,
  stages?: Stage[],
  ambientTemp?: number,
  currentStageId?: string | null
): CuringEstimate {
  const effectiveTemp = ambientTemp ?? 25
  const layerDetails = calculateCuringTime(layers, moldAreaMm2, effectiveTemp)
  const totalHours = layerDetails.reduce((sum, detail) => sum + detail.hours, 0)
  const totalResinMl = layerDetails.reduce((sum, detail) => sum + detail.resinMl, 0)
  const totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0)

  const effectiveStages = stages && stages.length > 0
    ? stages
    : []
  const stageDetails = calculateStageCuring(effectiveStages, layers, moldAreaMm2)

  const stageTotalHours = stageDetails.reduce((sum, s) => sum + s.hours, 0)
  const stageTotalResin = stageDetails.reduce((sum, s) => sum + s.resinMl, 0)

  const occlusionWarnings = detectOcclusionWarnings(layers)
  const bubbleWarnings = detectBubbleWarnings(layers)
  const gravityWarnings = detectGravityWarnings(layers, moldType, moldWidth, moldHeight)
  const warnings: Warning[] = [...occlusionWarnings, ...bubbleWarnings, ...gravityWarnings]

  const overallRisk = getOverallRisk(stageDetails, warnings)
  const nextSuggestion = generateNextSuggestion(effectiveStages, stageDetails)

  const targetStageId = currentStageId ?? (stageDetails[0]?.stageId || null)
  const currentStageDetail = stageDetails.find((s) => s.stageId === targetStageId) ?? stageDetails[0]
  const currentStageRisk = currentStageDetail
    ? {
        stageId: currentStageDetail.stageId,
        stageName: currentStageDetail.stageName,
        level: currentStageDetail.riskLevel,
        messages: currentStageDetail.riskMessages,
      }
    : undefined

  return {
    totalHours: Math.round((stageTotalHours > 0 ? stageTotalHours : totalHours) * 100) / 100,
    totalResinMl: Math.round((stageTotalResin > 0 ? stageTotalResin : totalResinMl) * 100) / 100,
    totalThickness: Math.round(totalThickness * 100) / 100,
    layerDetails,
    stageDetails,
    warnings,
    overallRisk,
    nextSuggestion,
    currentStageRisk,
  }
}

export function generateStepCards(
  layers: Layer[],
  moldAreaMm2: number,
  stages?: Stage[]
): StepCardItem[] {
  const sorted = [...layers].sort((a, b) => a.order - b.order)
  return sorted.map((layer, index) => {
    let hours = layer.thickness * BASE_CURE_HOURS_PER_MM
    if (layer.type === 'colorPowder') hours *= 1.1
    if (layer.elements.length > 5) hours *= 1.05
    const resinMl = Math.round(moldAreaMm2 * layer.thickness * RESIN_ML_PER_MM2_PER_MM * 100) / 100
    const elementNames = [...new Set(layer.elements.map((e) => e.name))]
    return {
      stepNumber: index + 1,
      layerName: layer.name,
      layerType: layer.type,
      thickness: layer.thickness,
      resinMl,
      curingHours: Math.round(hours * 100) / 100,
      elementCount: layer.elements.length,
      elementNames,
      tips: CATEGORY_TIPS[layer.type],
    }
  })
}

export function getCategoryLabel(type: MaterialCategory): string {
  return CATEGORY_LABELS[type]
}

export function getStageLabel(type: StageType): string {
  return STAGE_LABELS[type]
}

export function getStageTypeOrder(): StageType[] {
  return [...STAGE_TYPE_ORDER]
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return '高风险'
    case 'medium':
      return '中等风险'
    default:
      return '低风险'
  }
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return '#EF4444'
    case 'medium':
      return '#F59E0B'
    default:
      return '#6B8E6B'
  }
}

export function compareSchemes(schemeA: Scheme, schemeB: Scheme): SchemeComparison {
  const shapeA = MOLD_SHAPE_MAP[schemeA.moldType]
  const shapeB = MOLD_SHAPE_MAP[schemeB.moldType]
  const moldA = estimateCuring(
    schemeA.layers,
    schemeA.moldType,
    shapeA.width,
    shapeA.height,
    shapeA.areaMm2,
    schemeA.stages,
    schemeA.ambientTemp
  )

  const moldB = estimateCuring(
    schemeB.layers,
    schemeB.moldType,
    shapeB.width,
    shapeB.height,
    shapeB.areaMm2,
    schemeB.stages,
    schemeB.ambientTemp
  )

  const countByCategory = (layers: Layer[]) => {
    const counts: Record<MaterialCategory, number> = {
      driedFlower: 0,
      glitter: 0,
      goldFoil: 0,
      colorPowder: 0,
    }
    for (const l of layers) {
      counts[l.type] += l.elements.length
    }
    return counts
  }

  const countA = countByCategory(schemeA.layers)
  const countB = countByCategory(schemeB.layers)

  const categories: MaterialCategory[] = ['driedFlower', 'glitter', 'goldFoil', 'colorPowder']
  const totalMaterialDiff = categories.map((cat) => ({
    category: cat,
    countA: countA[cat],
    countB: countB[cat],
    diff: countB[cat] - countA[cat],
  }))

  const maxStages = Math.max(moldA.stageDetails.length, moldB.stageDetails.length)
  const stageComparisons: StageComparisonData[] = []
  for (let i = 0; i < maxStages; i++) {
    const a = moldA.stageDetails[i]
    const b = moldB.stageDetails[i]
    if (a || b) {
      stageComparisons.push({
        stageName: a?.stageName || b?.stageName || `阶段 ${i + 1}`,
        stageType: a?.stageType || b?.stageType || 'base',
        resinDiff: (b?.resinMl || 0) - (a?.resinMl || 0),
        hoursDiff: (b?.hours || 0) - (a?.hours || 0),
        thicknessDiff: (b?.thickness || 0) - (a?.thickness || 0),
        tempDiff: (b?.ambientTemp || 0) - (a?.ambientTemp || 0),
        risksA: a?.riskMessages || [],
        risksB: b?.riskMessages || [],
      })
    }
  }

  const riskCountA = moldA.stageDetails.filter((s) => s.riskLevel !== 'low').length
  const riskCountB = moldB.stageDetails.filter((s) => s.riskLevel !== 'low').length

  return {
    schemeAName: schemeA.name,
    schemeBName: schemeB.name,
    totalResinDiff: Math.round((moldB.totalResinMl - moldA.totalResinMl) * 100) / 100,
    totalHoursDiff: Math.round((moldB.totalHours - moldA.totalHours) * 100) / 100,
    totalThicknessDiff:
      Math.round(
        (schemeB.layers.reduce((s, l) => s + l.thickness, 0) -
          schemeA.layers.reduce((s, l) => s + l.thickness, 0)
      ) * 100) / 100,
    totalMaterialDiff,
    stageComparisons,
    riskDiff: {
      levelA: moldA.overallRisk,
      levelB: moldB.overallRisk,
      countA: riskCountA,
      countB: riskCountB,
    },
  }
}
