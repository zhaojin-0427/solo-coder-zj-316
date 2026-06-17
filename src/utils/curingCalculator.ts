import type { Layer, CuringEstimate, LayerCuringInfo, Warning, MoldType, MaterialElement, StepCardItem, MaterialCategory } from '../types'

const BASE_CURE_HOURS_PER_MM = 10
const RESIN_ML_PER_MM2_PER_MM = 0.001
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

function calculateCuringTime(layers: Layer[], moldAreaMm2: number): LayerCuringInfo[] {
  return layers.map((layer) => {
    let hours = layer.thickness * BASE_CURE_HOURS_PER_MM
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
    const cx = el.x + (el.width * el.scale) / 2
    const cy = el.y + (el.height * el.scale) / 2
    totalMass += mass
    weightedX += cx * mass
    weightedY += cy * mass
  }

  const centerX = weightedX / totalMass
  const centerY = weightedY / totalMass

  const moldCx = moldWidth / 2
  const moldCy = moldHeight / 2
  const distance = Math.sqrt((centerX - moldCx) ** 2 + (centerY - moldCy) ** 2)
  const threshold = Math.min(moldWidth, moldHeight) * 0.3

  if (distance > threshold) {
    warnings.push({
      type: 'gravity',
      level: 'danger',
      message: '元素重心偏离模具中心过远，可能导致材料分布不均',
    })
  }

  return warnings
}

export function estimateCuring(
  layers: Layer[],
  moldType: MoldType,
  moldWidth: number,
  moldHeight: number,
  moldAreaMm2: number
): CuringEstimate {
  const layerDetails = calculateCuringTime(layers, moldAreaMm2)
  const totalHours = layerDetails.reduce((sum, detail) => sum + detail.hours, 0)
  const totalResinMl = layerDetails.reduce((sum, detail) => sum + detail.resinMl, 0)

  const occlusionWarnings = detectOcclusionWarnings(layers)
  const bubbleWarnings = detectBubbleWarnings(layers)
  const gravityWarnings = detectGravityWarnings(layers, moldType, moldWidth, moldHeight)
  const warnings: Warning[] = [...occlusionWarnings, ...bubbleWarnings, ...gravityWarnings]

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalResinMl: Math.round(totalResinMl * 100) / 100,
    layerDetails,
    warnings,
  }
}

export function generateStepCards(
  layers: Layer[],
  moldAreaMm2: number
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
