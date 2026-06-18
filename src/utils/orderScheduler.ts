import type {
  CustomerOrder,
  OrderMaterialItem,
  ProductionStage,
  OrderAlert,
  OrderStatus,
  Scheme,
  Quotation,
  Stage,
  InventoryMaterial,
  InventoryCategory,
  Layer,
} from '../types'
import { estimateCuring } from './curingCalculator'
import { MOLD_SHAPE_MAP } from './moldShapes'
import { estimateConsumption } from './costCalculator'

const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending_material',
  'pending_pour',
  'curing',
  'pending_demold',
  'pending_packaging',
  'delivered',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_material: '待备料',
  pending_pour: '待浇筑',
  curing: '固化中',
  pending_demold: '待脱模',
  pending_packaging: '待包装',
  delivered: '已交付',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_material: '#F59E0B',
  pending_pour: '#8B5CF6',
  curing: '#3B82F6',
  pending_demold: '#EC4899',
  pending_packaging: '#14B8A6',
  delivered: '#22C55E',
}

export const ORDER_SOURCE_LABELS: Record<string, string> = {
  online: '线上订单',
  offline: '线下门店',
  referral: '客户推荐',
  exhibition: '展会活动',
  other: '其他来源',
}

export const LOGISTICS_LABELS: Record<string, string> = {
  express: '普通快递',
  sf: '顺丰速运',
  ems: 'EMS',
  pickup: '到店自提',
  other: '其他方式',
}

function generateOrderNo(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `DD${dateStr}${random}`
}

export function calculateProductionStages(
  stages: Stage[],
  layers: Layer[],
  moldAreaMm2: number,
  startAt: number = Date.now()
): ProductionStage[] {
  const curingEstimate = estimateCuring(
    layers,
    'pendant',
    100,
    100,
    moldAreaMm2,
    stages
  )

  const result: ProductionStage[] = []
  let currentTime = startAt

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  sortedStages.forEach((stage, index) => {
    const stageCuring = curingEstimate.stageDetails.find((s) => s.stageId === stage.id)
    const durationHours = stageCuring?.hours || stage.waitHours || 12

    result.push({
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.type,
      plannedStartAt: currentTime,
      plannedEndAt: currentTime + durationHours * 60 * 60 * 1000,
      actualStartAt: null,
      actualEndAt: null,
      durationHours: Math.round(durationHours * 100) / 100,
      status: 'pending',
    })

    currentTime += durationHours * 60 * 60 * 1000
  })

  return result
}

export function calculateMaterialItems(
  layers: Layer[],
  stages: Stage[],
  moldAreaMm2: number,
  inventory: InventoryMaterial[]
): OrderMaterialItem[] {
  const { consumptions } = estimateConsumption(layers, stages, moldAreaMm2, inventory)

  return consumptions.map((c) => {
    const shortageQty = c.remainingStock < 0 ? Math.abs(c.remainingStock) : 0
    return {
      materialId: c.materialId,
      materialName: c.materialName,
      category: c.category,
      requiredQty: c.consumedQty,
      unit: c.unit,
      inStock: Math.max(c.remainingStock, 0),
      shortageQty,
      unitPrice: c.unitPrice,
      subtotal: c.subtotal,
    }
  })
}

export function generateOrderAlerts(
  order: CustomerOrder,
  now: number = Date.now()
): OrderAlert[] {
  const alerts: OrderAlert[] = []

  const hoursToDelivery = (order.deliveryDate - now) / (60 * 60 * 1000)
  if (hoursToDelivery <= 24 && order.status !== 'delivered') {
    alerts.push({
      type: 'delivery_urgent',
      level: hoursToDelivery <= 6 ? 'danger' : 'warning',
      message: hoursToDelivery <= 6
        ? `交付紧急！仅剩 ${Math.max(1, Math.round(hoursToDelivery))} 小时`
        : `临近交付日期，剩余 ${Math.round(hoursToDelivery)} 小时`,
    })
  }

  const hasShortage = order.materials.some((m) => m.shortageQty > 0)
  if (hasShortage && order.status === 'pending_material') {
    const shortageList = order.materials
      .filter((m) => m.shortageQty > 0)
      .map((m) => `${m.materialName}缺${m.shortageQty}${m.unit}`)
      .join('、')
    alerts.push({
      type: 'insufficient_stock',
      level: 'danger',
      message: `库存未备齐：${shortageList}`,
    })
  }

  const totalPlannedHours = order.productionStages.reduce((s, st) => s + st.durationHours, 0)
  const totalPlannedMs = totalPlannedHours * 60 * 60 * 1000
  const packagingHours = 2
  const earliestDelivery = (order.productionStages[0]?.plannedStartAt || now) + totalPlannedMs + packagingHours * 60 * 60 * 1000
  if (earliestDelivery > order.deliveryDate && order.status !== 'delivered') {
    const overdueHours = Math.round((earliestDelivery - order.deliveryDate) / (60 * 60 * 1000))
    alerts.push({
      type: 'curing_overdue',
      level: 'danger',
      message: `固化总时长预计超出交付窗口 ${overdueHours} 小时，可能无法按时交付`,
    })
  }

  if (!order.quotationConfirmed && order.quotationId) {
    alerts.push({
      type: 'quotation_unconfirmed',
      level: 'warning',
      message: '报价单尚未确认，请先与客户确认报价',
    })
  }

  if (!order.balancePaid && order.status === 'pending_packaging') {
    alerts.push({
      type: 'balance_unpaid',
      level: 'danger',
      message: `尾款 ¥${order.balanceAmount.toFixed(2)} 未收齐，请勿发货`,
    })
  }

  return alerts
}

export function determineOrderStatus(stages: ProductionStage[]): OrderStatus {
  const completedCount = stages.filter((s) => s.status === 'completed').length
  const inProgress = stages.some((s) => s.status === 'in_progress')

  if (completedCount === 0) {
    if (inProgress) return 'pending_pour'
    return 'pending_material'
  }

  if (completedCount < stages.length) {
    if (inProgress) return 'curing'
    return 'pending_pour'
  }

  return 'pending_packaging'
}

export interface CreateOrderOptions {
  customerName: string
  contactPhone?: string
  contactInfo?: string
  source?: string
  customRequirements?: string
  depositAmount?: number
  deliveryDate: number
  logisticsMethod?: string
  remarks?: string
  schemeId?: string | null
  quotationId?: string | null
}

export function createOrderFromSchemeOrQuotation(
  scheme: Scheme | null,
  quotation: Quotation | null,
  inventory: InventoryMaterial[],
  options: CreateOrderOptions
): CustomerOrder {
  const targetScheme = scheme
  const targetQuotation = quotation

  const layers = targetScheme?.layers || []
  const stages = targetScheme?.stages || []
  const moldType = targetScheme?.moldType || targetQuotation?.moldType || 'pendant'
  const moldShape = MOLD_SHAPE_MAP[moldType]
  const schemeId = targetScheme?.id || targetQuotation?.schemeId || null
  const schemeName = targetScheme?.name || targetQuotation?.schemeName || '未命名方案'
  const quotationId = targetQuotation?.id || null

  const totalAmount = targetQuotation?.finalPrice || 0
  const depositAmount = options.depositAmount ?? Math.round(totalAmount * 0.3 * 100) / 100
  const balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100

  const materials = calculateMaterialItems(layers, stages, moldShape.areaMm2, inventory)
  const productionStages = calculateProductionStages(stages, layers, moldShape.areaMm2)
  const totalCuringHours = productionStages.reduce((s, st) => s + st.durationHours, 0)
  const laborHours = targetQuotation?.laborHours || Math.max(totalCuringHours / 24 * 2, 1)

  const initialStatus: OrderStatus = 'pending_material'

  const order: CustomerOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderNo: generateOrderNo(),
    customerName: options.customerName || targetQuotation?.customerName || '',
    contactPhone: options.contactPhone || '',
    contactInfo: options.contactInfo || '',
    source: (options.source as any) || 'other',
    customRequirements: options.customRequirements || '',
    depositAmount,
    balanceAmount,
    totalAmount,
    deliveryDate: options.deliveryDate,
    logisticsMethod: (options.logisticsMethod as any) || 'express',
    trackingNo: '',
    status: initialStatus,
    remarks: options.remarks || '',

    schemeId,
    schemeName,
    quotationId,
    moldType,

    laborHours,
    totalCuringHours: Math.round(totalCuringHours * 100) / 100,
    materials,
    productionStages,

    quotationConfirmed: targetQuotation?.status === 'accepted',
    depositPaid: depositAmount <= 0,
    balancePaid: balanceAmount <= 0,

    reviewIds: [],
    alerts: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  order.alerts = generateOrderAlerts(order)
  return order
}

export function updateOrderStatus(order: CustomerOrder, newStatus: OrderStatus): CustomerOrder {
  const now = Date.now()
  const stages = [...order.productionStages]

  if (newStatus === 'pending_pour' && stages[0]) {
    if (stages[0].status === 'pending') {
      stages[0] = { ...stages[0], status: 'in_progress', actualStartAt: now }
    }
  }

  if (newStatus === 'curing') {
    const firstPending = stages.findIndex((s) => s.status === 'pending')
    if (firstPending > 0) {
      stages[firstPending - 1] = { ...stages[firstPending - 1], status: 'completed', actualEndAt: now }
      stages[firstPending] = { ...stages[firstPending], status: 'in_progress', actualStartAt: now }
    } else if (firstPending === 0) {
      stages[0] = { ...stages[0], status: 'in_progress', actualStartAt: now }
    }
  }

  if (newStatus === 'pending_demold' || newStatus === 'pending_packaging') {
    stages.forEach((s, i) => {
      if (s.status !== 'completed') {
        stages[i] = {
          ...s,
          status: 'completed',
          actualStartAt: s.actualStartAt || now,
          actualEndAt: now,
        }
      }
    })
  }

  const updated = {
    ...order,
    status: newStatus,
    productionStages: stages,
    updatedAt: now,
  }
  updated.alerts = generateOrderAlerts(updated)
  return updated
}

export function advanceStage(order: CustomerOrder): CustomerOrder {
  const now = Date.now()
  const stages = [...order.productionStages]

  const inProgressIndex = stages.findIndex((s) => s.status === 'in_progress')
  const pendingIndex = stages.findIndex((s) => s.status === 'pending')

  if (inProgressIndex >= 0) {
    stages[inProgressIndex] = { ...stages[inProgressIndex], status: 'completed', actualEndAt: now }
  }

  const nextPending = stages.findIndex((s) => s.status === 'pending')
  if (nextPending >= 0) {
    stages[nextPending] = { ...stages[nextPending], status: 'in_progress', actualStartAt: now }
  }

  const newStatus = determineOrderStatus(stages)
  const updated = {
    ...order,
    productionStages: stages,
    status: newStatus,
    updatedAt: now,
  }
  updated.alerts = generateOrderAlerts(updated)
  return updated
}

export function getOrdersByStatus(orders: CustomerOrder[], status: OrderStatus): CustomerOrder[] {
  return orders
    .filter((o) => o.status === status)
    .sort((a, b) => a.deliveryDate - b.deliveryDate)
}
