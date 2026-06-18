import type {
  Layer,
  Stage,
  MoldType,
  InventoryMaterial,
  InventoryCategory,
  MaterialConsumption,
  CostWarning,
  CostEstimate,
  Quotation,
  QuotationItem,
  QuotationStatus,
} from '../types'

const CATEGORY_CONSUME_RATES: Record<InventoryCategory, { qtyPerElement: number; wasteRate: number }> = {
  driedFlower: { qtyPerElement: 0.5, wasteRate: 0.1 },
  glitter: { qtyPerElement: 0.2, wasteRate: 0.15 },
  goldFoil: { qtyPerElement: 0.3, wasteRate: 0.2 },
  colorPowder: { qtyPerElement: 0.15, wasteRate: 0.1 },
  abGlue: { qtyPerElement: 0, wasteRate: 0.05 },
  moldSupply: { qtyPerElement: 0, wasteRate: 0.02 },
}

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  driedFlower: '干花',
  glitter: '亮片',
  goldFoil: '金箔',
  colorPowder: '色粉',
  abGlue: 'AB胶',
  moldSupply: '模具耗材',
}

const MATERIAL_CATEGORY_MAP: Record<string, InventoryCategory> = {
  driedFlower: 'driedFlower',
  glitter: 'glitter',
  goldFoil: 'goldFoil',
  colorPowder: 'colorPowder',
}

const LABOR_RATE_PER_HOUR = 30
const RISK_MARKUP_RATE = 0.1
const DEFAULT_PROFIT_MARGIN = 0.3
const NEAR_EXPIRY_DAYS = 30
const HIGH_COST_THRESHOLD = 200

export { CATEGORY_LABELS, LABOR_RATE_PER_HOUR, DEFAULT_PROFIT_MARGIN }

export function estimateConsumption(
  layers: Layer[],
  stages: Stage[],
  moldAreaMm2: number,
  inventory: InventoryMaterial[]
): { consumptions: MaterialConsumption[]; totalResinMl: number } {
  const consumptions: MaterialConsumption[] = []
  const elementCounts: Record<string, number> = {}

  for (const layer of layers) {
    const cat = MATERIAL_CATEGORY_MAP[layer.type]
    if (!cat) continue
    elementCounts[cat] = (elementCounts[cat] || 0) + layer.elements.length
  }

  for (const [cat, count] of Object.entries(elementCounts)) {
    const category = cat as InventoryCategory
    const rate = CATEGORY_CONSUME_RATES[category]
    const consumedQty = count * rate.qtyPerElement
    const matchingMaterials = inventory.filter((m) => m.category === category)

    if (matchingMaterials.length > 0) {
      const material = matchingMaterials[0]
      const wasteCost = consumedQty * rate.wasteRate * material.purchasePrice
      consumptions.push({
        materialId: material.id,
        materialName: material.name,
        category,
        consumedQty: Math.round(consumedQty * 100) / 100,
        unit: material.unit,
        unitPrice: material.purchasePrice,
        subtotal: Math.round(consumedQty * material.purchasePrice * 100) / 100,
        remainingStock: Math.round((material.currentStock - consumedQty) * 100) / 100,
        wasteCost: Math.round(wasteCost * 100) / 100,
      })
    } else {
      const defaultPrices: Record<InventoryCategory, number> = {
        driedFlower: 5,
        glitter: 3,
        goldFoil: 8,
        colorPowder: 4,
        abGlue: 0.5,
        moldSupply: 2,
      }
      const wasteCost = consumedQty * rate.wasteRate * defaultPrices[category]
      consumptions.push({
        materialId: '',
        materialName: CATEGORY_LABELS[category],
        category,
        consumedQty: Math.round(consumedQty * 100) / 100,
        unit: category === 'abGlue' ? 'ml' : 'g',
        unitPrice: defaultPrices[category],
        subtotal: Math.round(consumedQty * defaultPrices[category] * 100) / 100,
        remainingStock: -1,
        wasteCost: Math.round(wasteCost * 100) / 100,
      })
    }
  }

  let totalResinMl = 0
  for (const stage of stages) {
    if (stage.glueMl > 0) {
      totalResinMl += stage.glueMl
    } else {
      const stageLayers = layers.filter((l) => stage.layerIds.includes(l.id))
      const stageThickness = stageLayers.length > 0
        ? stageLayers.reduce((s, l) => s + l.thickness, 0)
        : stage.thickness
      totalResinMl += moldAreaMm2 * stageThickness * 0.001
    }
  }
  totalResinMl = Math.round(totalResinMl * 100) / 100

  const glueMaterials = inventory.filter((m) => m.category === 'abGlue')
  if (glueMaterials.length > 0) {
    const glue = glueMaterials[0]
    const wasteCost = totalResinMl * CATEGORY_CONSUME_RATES.abGlue.wasteRate * glue.purchasePrice
    consumptions.push({
      materialId: glue.id,
      materialName: glue.name,
      category: 'abGlue',
      consumedQty: totalResinMl,
      unit: glue.unit,
      unitPrice: glue.purchasePrice,
      subtotal: Math.round(totalResinMl * glue.purchasePrice * 100) / 100,
      remainingStock: Math.round((glue.currentStock - totalResinMl) * 100) / 100,
      wasteCost: Math.round(wasteCost * 100) / 100,
    })
  } else {
    const wasteCost = totalResinMl * 0.05 * 0.5
    consumptions.push({
      materialId: '',
      materialName: CATEGORY_LABELS.abGlue,
      category: 'abGlue',
      consumedQty: totalResinMl,
      unit: 'ml',
      unitPrice: 0.5,
      subtotal: Math.round(totalResinMl * 0.5 * 100) / 100,
      remainingStock: -1,
      wasteCost: Math.round(wasteCost * 100) / 100,
    })
  }

  return { consumptions, totalResinMl }
}

export function generateWarnings(
  consumptions: MaterialConsumption[],
  inventory: InventoryMaterial[],
  stages: Stage[]
): CostWarning[] {
  const warnings: CostWarning[] = []
  const now = Date.now()

  for (const c of consumptions) {
    if (c.remainingStock >= 0 && c.remainingStock < 0) {
      warnings.push({
        type: 'lowStock',
        level: 'danger',
        message: `${c.materialName} 库存不足！消耗 ${c.consumedQty}${c.unit}，剩余 ${c.remainingStock}${c.unit}`,
        materialId: c.materialId,
        materialName: c.materialName,
      })
    }

    if (c.materialId) {
      const material = inventory.find((m) => m.id === c.materialId)
      if (material) {
        if (material.currentStock <= material.minWarning) {
          warnings.push({
            type: 'lowStock',
            level: 'warning',
            message: `${material.name} 库存接近预警线 (当前: ${material.currentStock}${material.unit}, 预警: ${material.minWarning}${material.unit})`,
            materialId: material.id,
            materialName: material.name,
          })
        }

        if (material.expiryDate) {
          const expiryMs = new Date(material.expiryDate).getTime()
          const daysLeft = Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 0) {
            warnings.push({
              type: 'nearExpiry',
              level: 'danger',
              message: `${material.name} 已过期！`,
              materialId: material.id,
              materialName: material.name,
            })
          } else if (daysLeft <= NEAR_EXPIRY_DAYS) {
            warnings.push({
              type: 'nearExpiry',
              level: 'warning',
              message: `${material.name} 即将过期 (剩余 ${daysLeft} 天)`,
              materialId: material.id,
              materialName: material.name,
            })
          }
        }
      }
    }
  }

  const batchSet = new Set<string>()
  for (const stage of stages) {
    if (stage.materialBatch) {
      batchSet.add(stage.materialBatch)
    }
  }
  if (batchSet.size > 1) {
    warnings.push({
      type: 'batchMismatch',
      level: 'info',
      message: `检测到 ${batchSet.size} 个不同批次号: ${Array.from(batchSet).join('、')}，请注意材料一致性`,
    })
  }

  return warnings
}

export function estimateCost(
  layers: Layer[],
  stages: Stage[],
  moldAreaMm2: number,
  inventory: InventoryMaterial[],
  laborHours?: number,
  profitMargin?: number
): CostEstimate {
  const { consumptions, totalResinMl } = estimateConsumption(layers, stages, moldAreaMm2, inventory)

  const totalMaterialCost = consumptions.reduce((s, c) => s + c.subtotal, 0)
  const totalWasteCost = consumptions.reduce((s, c) => s + c.wasteCost, 0)

  const resinConsumption = consumptions.find((c) => c.category === 'abGlue')
  const resinCost = resinConsumption ? resinConsumption.subtotal : totalResinMl * 0.5

  const estimatedLaborHours = laborHours ?? Math.max(
    stages.reduce((s, st) => s + st.waitHours, 0) / 24 * 2,
    1
  )
  const laborCost = Math.round(estimatedLaborHours * LABOR_RATE_PER_HOUR * 100) / 100

  const baseCost = totalMaterialCost + totalWasteCost + laborCost
  const riskMarkup = Math.round(baseCost * RISK_MARKUP_RATE * 100) / 100

  const totalCost = Math.round((baseCost + riskMarkup) * 100) / 100
  const margin = profitMargin ?? DEFAULT_PROFIT_MARGIN
  const suggestedPrice = Math.round(totalCost / (1 - margin) * 100) / 100

  const warnings = generateWarnings(consumptions, inventory, stages)

  if (totalCost > HIGH_COST_THRESHOLD) {
    warnings.push({
      type: 'highCost',
      level: 'warning',
      message: `制作总成本 ¥${totalCost.toFixed(2)} 偏高，请检查材料用量和价格`,
    })
  }

  return {
    consumptions,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalWasteCost,
    totalResinMl,
    resinCost: Math.round(resinCost * 100) / 100,
    laborCost,
    riskMarkup,
    totalCost,
    suggestedPrice,
    warnings,
  }
}

export function generateQuotation(
  schemeId: string,
  schemeName: string,
  moldType: MoldType,
  layers: Layer[],
  stages: Stage[],
  moldAreaMm2: number,
  inventory: InventoryMaterial[],
  options: {
    customerName?: string
    laborHours?: number
    profitMargin?: number
    customerNotes?: string
    internalNotes?: string
  } = {}
): Quotation {
  const costEstimate = estimateCost(layers, stages, moldAreaMm2, inventory, options.laborHours, options.profitMargin)

  const items: QuotationItem[] = costEstimate.consumptions.map((c) => {
    const material = inventory.find((m) => m.id === c.materialId)
    return {
      materialId: c.materialId,
      materialName: c.materialName,
      category: c.category,
      spec: material?.spec || '',
      unit: c.unit,
      quantity: c.consumedQty,
      unitPrice: c.unitPrice,
      subtotal: c.subtotal,
    }
  })

  const margin = options.profitMargin ?? DEFAULT_PROFIT_MARGIN
  const baseCost = costEstimate.totalMaterialCost + costEstimate.totalWasteCost + costEstimate.laborCost
  const riskMarkup = costEstimate.riskMarkup
  const finalPrice = Math.round((baseCost + riskMarkup) / (1 - margin) * 100) / 100

  return {
    id: `quotation-${Date.now()}`,
    schemeId,
    schemeName,
    moldType,
    customerName: options.customerName || '',
    status: 'draft' as QuotationStatus,
    items,
    totalResinMl: costEstimate.totalResinMl,
    resinCost: costEstimate.resinCost,
    materialCost: costEstimate.totalMaterialCost,
    wasteCost: costEstimate.totalWasteCost,
    laborHours: options.laborHours ?? Math.max(stages.reduce((s, st) => s + st.waitHours, 0) / 24 * 2, 1),
    laborCost: costEstimate.laborCost,
    riskMarkup,
    profitMargin: margin,
    finalPrice,
    customerNotes: options.customerNotes || '',
    internalNotes: options.internalNotes || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function getQuotationStatusLabel(status: QuotationStatus): string {
  const labels: Record<QuotationStatus, string> = {
    draft: '草稿',
    sent: '已发送',
    accepted: '已接受',
    rejected: '已拒绝',
    expired: '已过期',
  }
  return labels[status] || status
}

export function getQuotationStatusColor(status: QuotationStatus): string {
  const colors: Record<QuotationStatus, string> = {
    draft: '#8B7355',
    sent: '#87CEEB',
    accepted: '#6B8E6B',
    rejected: '#EF4444',
    expired: '#F59E0B',
  }
  return colors[status] || '#8B7355'
}
