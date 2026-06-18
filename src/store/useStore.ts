import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  MoldType,
  Layer,
  MaterialElement,
  Scheme,
  MaterialCategory,
  Stage,
  StageType,
  ReviewRecord,
  KnowledgeCard,
  DefectItem,
  DefoamingMethod,
  SuccessRate,
  InventoryMaterial,
  InventoryCategory,
  Quotation,
  QuotationStatus,
  CustomerOrder,
  OrderStatus,
} from '../types'
import { updateOrderStatus, advanceStage, generateOrderAlerts } from '../utils/orderScheduler'

const DEFAULT_AMBIENT_TEMP = 25

interface EditorState {
  currentMoldType: MoldType
  layers: Layer[]
  stages: Stage[]
  currentStageId: string | null
  ambientTemp: number
  selectedElementId: string | null
  selectedLayerId: string | null
  schemes: Scheme[]
  currentSchemeId: string | null
  reviewRecords: ReviewRecord[]
  knowledgeCards: KnowledgeCard[]
  inventoryMaterials: InventoryMaterial[]
  quotations: Quotation[]
  customerOrders: CustomerOrder[]

  setMoldType: (type: MoldType) => void
  setAmbientTemp: (temp: number) => void
  addLayer: (type: MaterialCategory, name: string) => string
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  addElement: (layerId: string, element: MaterialElement) => void
  removeElement: (id: string) => void
  updateElement: (id: string, updates: Partial<MaterialElement>) => void
  selectElement: (id: string | null) => void
  selectLayer: (id: string | null) => void

  addStage: (type: StageType, name?: string) => string
  removeStage: (id: string) => void
  updateStage: (id: string, updates: Partial<Stage>) => void
  reorderStages: (fromIndex: number, toIndex: number) => void
  selectStage: (id: string | null) => void
  assignLayerToStage: (stageId: string, layerId: string) => void
  removeLayerFromStage: (stageId: string, layerId: string) => void

  saveScheme: (name: string) => void
  loadScheme: (id: string) => void
  deleteScheme: (id: string) => void
  clearCanvas: () => void

  addReviewRecord: (record: Omit<ReviewRecord, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateReviewRecord: (id: string, updates: Partial<ReviewRecord>) => void
  deleteReviewRecord: (id: string) => void
  getReviewsBySchemeId: (schemeId: string) => ReviewRecord[]

  addKnowledgeCard: (card: Omit<KnowledgeCard, 'id' | 'createdAt'>) => string
  deleteKnowledgeCard: (id: string) => void
  generateKnowledgeCard: (reviewId: string) => string | null

  addInventoryMaterial: (material: Omit<InventoryMaterial, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateInventoryMaterial: (id: string, updates: Partial<InventoryMaterial>) => void
  deleteInventoryMaterial: (id: string) => void

  addQuotation: (quotation: Quotation) => string
  updateQuotation: (id: string, updates: Partial<Quotation>) => void
  deleteQuotation: (id: string) => void

  addCustomerOrder: (order: CustomerOrder) => string
  updateCustomerOrder: (id: string, updates: Partial<CustomerOrder>) => void
  deleteCustomerOrder: (id: string) => void
  advanceOrderStage: (id: string) => void
  setCustomerOrderStatus: (id: string, status: OrderStatus) => void
  refreshOrderAlerts: (id: string) => void

  showKnowledgeDrawer: boolean
  setShowKnowledgeDrawer: (show: boolean) => void
  viewingReviewId: string | null
  setViewingReviewId: (id: string | null) => void
}

let layerCounter = 0
let elementCounter = 0
let stageCounter = 0

function createDefaultStages(): Stage[] {
  const temp = DEFAULT_AMBIENT_TEMP
  return [
    {
      id: `stage-${Date.now()}-${++stageCounter}`,
      name: '底胶层',
      type: 'base',
      order: 0,
      layerIds: [],
      glueMl: 0,
      thickness: 1,
      waitHours: 12,
      ambientTemp: temp,
      materialBatch: '',
      notes: '',
    },
    {
      id: `stage-${Date.now()}-${++stageCounter}`,
      name: '材料定位层',
      type: 'material',
      order: 1,
      layerIds: [],
      glueMl: 0,
      thickness: 1.5,
      waitHours: 18,
      ambientTemp: temp,
      materialBatch: '',
      notes: '',
    },
    {
      id: `stage-${Date.now()}-${++stageCounter}`,
      name: '封胶层',
      type: 'sealant',
      order: 2,
      layerIds: [],
      glueMl: 0,
      thickness: 1.5,
      waitHours: 24,
      ambientTemp: temp,
      materialBatch: '',
      notes: '',
    },
    {
      id: `stage-${Date.now()}-${++stageCounter}`,
      name: '补胶修正层',
      type: 'correction',
      order: 3,
      layerIds: [],
      glueMl: 0,
      thickness: 0.5,
      waitHours: 12,
      ambientTemp: temp,
      materialBatch: '',
      notes: '',
    },
  ]
}

function migrateScheme(scheme: unknown): Scheme {
  const s = scheme as Partial<Scheme> & { [key: string]: unknown }
  if (!s.stages || !Array.isArray(s.stages) || s.stages.length === 0) {
    s.stages = createDefaultStages()
  }
  if (typeof s.ambientTemp !== 'number' || s.ambientTemp < 5 || s.ambientTemp > 50) {
    s.ambientTemp = DEFAULT_AMBIENT_TEMP
  }
  s.stages = s.stages.map((stage: any) => {
    if (typeof stage.ambientTemp !== 'number' || stage.ambientTemp < 5 || stage.ambientTemp > 50) {
      stage.ambientTemp = s.ambientTemp
    }
    return stage
  })
  return s as Scheme
}

function migrateReviewRecord(record: unknown): ReviewRecord {
  const r = record as Partial<ReviewRecord> & { [key: string]: unknown }
  if (!r.defects || !Array.isArray(r.defects)) {
    r.defects = []
  }
  if (!r.photoUrls || !Array.isArray(r.photoUrls)) {
    r.photoUrls = []
  }
  if (!r.photoNotes) {
    r.photoNotes = ''
  }
  if (!r.stageTemps || !Array.isArray(r.stageTemps)) {
    r.stageTemps = []
  }
  if (!r.materialCategories || !Array.isArray(r.materialCategories)) {
    r.materialCategories = []
  }
  if (!r.actualStatus) {
    r.actualStatus = ''
  }
  if (!r.improvements) {
    r.improvements = ''
  }
  if (typeof r.actualCuringHours !== 'number') {
    r.actualCuringHours = 0
  }
  if (typeof r.ambientHumidity !== 'number') {
    r.ambientHumidity = 50
  }
  if (!r.abRatio) {
    r.abRatio = '3:1'
  }
  if (!r.defoamingMethod) {
    r.defoamingMethod = 'none'
  }
  if (typeof r.demoldTime !== 'number') {
    r.demoldTime = 24
  }
  if (!r.successRate) {
    r.successRate = 'good'
  }
  if (typeof r.totalThickness !== 'number') {
    r.totalThickness = 0
  }
  if (!r.schemeName) {
    r.schemeName = ''
  }
  if (typeof r.ambientTemp !== 'number' || r.ambientTemp < 5 || r.ambientTemp > 50) {
    r.ambientTemp = 25
  }
  if (typeof r.ambientHumidity !== 'number' || r.ambientHumidity < 0 || r.ambientHumidity > 100) {
    r.ambientHumidity = 50
  }
  if (typeof r.actualCuringHours !== 'number' || r.actualCuringHours < 0) {
    r.actualCuringHours = 24
  }
  if (typeof r.demoldTime !== 'number' || r.demoldTime < 0) {
    r.demoldTime = 24
  }
  return r as ReviewRecord
}

function migrateKnowledgeCard(card: unknown): KnowledgeCard {
  const c = card as Partial<KnowledgeCard> & { [key: string]: unknown }
  if (!c.defects || !Array.isArray(c.defects)) {
    c.defects = []
  }
  if (!c.materialCategories || !Array.isArray(c.materialCategories)) {
    c.materialCategories = []
  }
  if (!c.improvements) {
    c.improvements = ''
  }
  if (typeof c.avgTemp !== 'number' || c.avgTemp < 5 || c.avgTemp > 50) {
    c.avgTemp = 25
  }
  if (typeof c.actualCuringHours !== 'number' || c.actualCuringHours < 0) {
    c.actualCuringHours = 0
  }
  if (!c.defoamingMethod) {
    c.defoamingMethod = 'none'
  }
  if (!c.schemeName) {
    c.schemeName = ''
  }
  if (typeof c.totalThickness !== 'number' || c.totalThickness < 0) {
    c.totalThickness = 0
  }
  if (!c.successRate) {
    c.successRate = 'good'
  }
  return c as KnowledgeCard
}

let reviewCounter = 0
let knowledgeCounter = 0
let inventoryCounter = 0
let quotationCounter = 0
let orderCounter = 0

function migrateInventoryMaterial(material: unknown): InventoryMaterial {
  const m = material as Partial<InventoryMaterial> & { [key: string]: unknown }
  if (!m.name) m.name = ''
  if (!m.category) m.category = 'abGlue' as InventoryCategory
  if (!m.spec) m.spec = ''
  if (!m.unit) m.unit = 'g'
  if (typeof m.purchasePrice !== 'number' || m.purchasePrice < 0) m.purchasePrice = 0
  if (typeof m.currentStock !== 'number' || m.currentStock < 0) m.currentStock = 0
  if (typeof m.minWarning !== 'number' || m.minWarning < 0) m.minWarning = 0
  if (!m.supplier) m.supplier = ''
  if (!m.batchNo) m.batchNo = ''
  if (!m.expiryDate) m.expiryDate = ''
  if (!m.notes) m.notes = ''
  if (typeof m.createdAt !== 'number') m.createdAt = Date.now()
  if (typeof m.updatedAt !== 'number') m.updatedAt = Date.now()
  return m as InventoryMaterial
}

function migrateQuotation(quotation: unknown): Quotation {
  const q = quotation as Partial<Quotation> & { [key: string]: unknown }
  if (!q.schemeId) q.schemeId = ''
  if (!q.schemeName) q.schemeName = ''
  if (!q.moldType) q.moldType = 'pendant' as MoldType
  if (!q.customerName) q.customerName = ''
  if (!q.status) q.status = 'draft' as QuotationStatus
  if (!q.items || !Array.isArray(q.items)) q.items = []
  if (typeof q.totalResinMl !== 'number') q.totalResinMl = 0
  if (typeof q.resinCost !== 'number') q.resinCost = 0
  if (typeof q.materialCost !== 'number') q.materialCost = 0
  if (typeof q.wasteCost !== 'number') q.wasteCost = 0
  if (typeof q.laborHours !== 'number') q.laborHours = 0
  if (typeof q.laborCost !== 'number') q.laborCost = 0
  if (typeof q.riskMarkup !== 'number') q.riskMarkup = 0
  if (typeof q.profitMargin !== 'number') q.profitMargin = 0.3
  if (typeof q.finalPrice !== 'number') q.finalPrice = 0
  if (!q.customerNotes) q.customerNotes = ''
  if (!q.internalNotes) q.internalNotes = ''
  if (typeof q.createdAt !== 'number') q.createdAt = Date.now()
  if (typeof q.updatedAt !== 'number') q.updatedAt = Date.now()
  return q as Quotation
}

function migrateCustomerOrder(order: unknown): CustomerOrder {
  const o = order as Partial<CustomerOrder> & { [key: string]: unknown }
  if (!o.id) o.id = `order-${Date.now()}-${++orderCounter}`
  if (!o.orderNo) o.orderNo = `DD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 9000 + 1000)}`
  if (!o.customerName) o.customerName = ''
  if (!o.contactPhone) o.contactPhone = ''
  if (!o.contactInfo) o.contactInfo = ''
  if (!o.source) o.source = 'other'
  if (!o.customRequirements) o.customRequirements = ''
  if (typeof o.depositAmount !== 'number') o.depositAmount = 0
  if (typeof o.balanceAmount !== 'number') o.balanceAmount = 0
  if (typeof o.totalAmount !== 'number') o.totalAmount = 0
  if (typeof o.deliveryDate !== 'number') o.deliveryDate = Date.now() + 7 * 24 * 60 * 60 * 1000
  if (!o.logisticsMethod) o.logisticsMethod = 'express'
  if (!o.trackingNo) o.trackingNo = ''
  if (!o.status) o.status = 'pending_material'
  if (!o.remarks) o.remarks = ''
  if (!o.schemeId) o.schemeId = null
  if (!o.schemeName) o.schemeName = ''
  if (!o.quotationId) o.quotationId = null
  if (!o.moldType) o.moldType = 'pendant'
  if (typeof o.laborHours !== 'number') o.laborHours = 0
  if (typeof o.totalCuringHours !== 'number') o.totalCuringHours = 0
  if (!o.materials || !Array.isArray(o.materials)) o.materials = []
  if (!o.productionStages || !Array.isArray(o.productionStages)) o.productionStages = []
  if (typeof o.quotationConfirmed !== 'boolean') o.quotationConfirmed = false
  if (typeof o.depositPaid !== 'boolean') o.depositPaid = false
  if (typeof o.balancePaid !== 'boolean') o.balancePaid = false
  if (!o.reviewIds || !Array.isArray(o.reviewIds)) o.reviewIds = []
  if (!o.alerts || !Array.isArray(o.alerts)) o.alerts = []
  if (typeof o.createdAt !== 'number') o.createdAt = Date.now()
  if (typeof o.updatedAt !== 'number') o.updatedAt = Date.now()
  return o as CustomerOrder
}

export const useStore = create<EditorState>()(
  persist(
    (set, get) => {
      const initialStages = createDefaultStages()
      return {
        currentMoldType: 'pendant',
        layers: [],
        stages: initialStages,
        currentStageId: initialStages[0]?.id || null,
        ambientTemp: DEFAULT_AMBIENT_TEMP,
        selectedElementId: null,
        selectedLayerId: null,
        schemes: [],
        currentSchemeId: null,
        reviewRecords: [],
        knowledgeCards: [],
        inventoryMaterials: [],
        quotations: [],
        customerOrders: [],
        showKnowledgeDrawer: false,
        viewingReviewId: null,

      setMoldType: (type) => set({ currentMoldType: type }),

      setAmbientTemp: (temp) =>
        set((state) => ({
          ambientTemp: temp,
          stages: state.stages.map((s) => ({ ...s, ambientTemp: temp })),
        })),

      addLayer: (type, name) => {
        layerCounter++
        const id = `layer-${Date.now()}-${layerCounter}`
        const newLayer: Layer = {
          id,
          name: name || `${type === 'driedFlower' ? '干花' : type === 'glitter' ? '亮片' : type === 'goldFoil' ? '金箔' : type === 'colorPowder' ? '色粉' : type === 'abGlue' ? 'AB胶' : '模具耗材'}层 ${layerCounter}`,
          type,
          order: get().layers.length,
          opacity: 1,
          thickness: 1,
          locked: false,
          elements: [],
        }
        set((state) => ({ layers: [...state.layers, newLayer] }))
        return id
      },

      removeLayer: (id) =>
        set((state) => ({
          layers: state.layers.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i })),
          selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
          stages: state.stages.map((s) => ({
            ...s,
            layerIds: s.layerIds.filter((lid) => lid !== id),
          })),
        })),

      updateLayer: (id, updates) =>
        set((state) => ({
          layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      reorderLayers: (fromIndex, toIndex) =>
        set((state) => {
          const newLayers = [...state.layers]
          const [removed] = newLayers.splice(fromIndex, 1)
          newLayers.splice(toIndex, 0, removed)
          return { layers: newLayers.map((l, i) => ({ ...l, order: i })) }
        }),

      addElement: (layerId, element) =>
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId ? { ...l, elements: [...l.elements, element] } : l
          ),
        })),

      removeElement: (id) =>
        set((state) => ({
          layers: state.layers.map((l) => ({
            ...l,
            elements: l.elements.filter((e) => e.id !== id),
          })),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        })),

      updateElement: (id, updates) =>
        set((state) => ({
          layers: state.layers.map((l) => ({
            ...l,
            elements: l.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          })),
        })),

      selectElement: (id) => set({ selectedElementId: id }),
      selectLayer: (id) => set({ selectedLayerId: id }),

      addStage: (type, name) => {
        stageCounter++
        const id = `stage-${Date.now()}-${stageCounter}`
        const typeNames: Record<StageType, string> = {
          base: '底胶层',
          material: '材料定位层',
          sealant: '封胶层',
          correction: '补胶修正层',
        }
        const typeDefaults: Record<StageType, { thickness: number; waitHours: number }> = {
          base: { thickness: 1, waitHours: 12 },
          material: { thickness: 1.5, waitHours: 18 },
          sealant: { thickness: 1.5, waitHours: 24 },
          correction: { thickness: 0.5, waitHours: 12 },
        }
        const defaults = typeDefaults[type]
        const newStage: Stage = {
          id,
          name: name || typeNames[type],
          type,
          order: get().stages.length,
          layerIds: [],
          glueMl: 0,
          thickness: defaults.thickness,
          waitHours: defaults.waitHours,
          ambientTemp: get().ambientTemp,
          materialBatch: '',
          notes: '',
        }
        set((state) => ({ stages: [...state.stages, newStage], currentStageId: id }))
        return id
      },

      removeStage: (id) =>
        set((state) => {
          if (state.stages.length <= 1) return state
          const remaining = state.stages
            .filter((s) => s.id !== id)
            .map((s, i) => ({ ...s, order: i }))
          return {
            stages: remaining,
            currentStageId: state.currentStageId === id ? remaining[0]?.id || null : state.currentStageId,
          }
        }),

      updateStage: (id, updates) =>
        set((state) => ({
          stages: state.stages.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      reorderStages: (fromIndex, toIndex) =>
        set((state) => {
          const newStages = [...state.stages]
          const [removed] = newStages.splice(fromIndex, 1)
          newStages.splice(toIndex, 0, removed)
          return { stages: newStages.map((s, i) => ({ ...s, order: i })) }
        }),

      selectStage: (id) => set({ currentStageId: id }),

      assignLayerToStage: (stageId, layerId) =>
        set((state) => ({
          stages: state.stages.map((s) => {
            if (s.id !== stageId) return s
            if (s.layerIds.includes(layerId)) return s
            return { ...s, layerIds: [...s.layerIds, layerId] }
          }),
        })),

      removeLayerFromStage: (stageId, layerId) =>
        set((state) => ({
          stages: state.stages.map((s) =>
            s.id === stageId ? { ...s, layerIds: s.layerIds.filter((id) => id !== layerId) } : s
          ),
        })),

      saveScheme: (name) => {
        const state = get()
        const scheme: Scheme = {
          id: `scheme-${Date.now()}`,
          name,
          moldType: state.currentMoldType,
          layers: JSON.parse(JSON.stringify(state.layers)),
          stages: JSON.parse(JSON.stringify(state.stages)),
          ambientTemp: state.ambientTemp,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          schemes: [...state.schemes, scheme],
          currentSchemeId: scheme.id,
        }))
      },

      loadScheme: (id) => {
        const raw = get().schemes.find((s) => s.id === id)
        if (!raw) return
        const scheme = migrateScheme(raw)
        set({
          currentMoldType: scheme.moldType,
          layers: JSON.parse(JSON.stringify(scheme.layers)),
          stages: JSON.parse(JSON.stringify(scheme.stages)),
          ambientTemp: scheme.ambientTemp,
          currentSchemeId: id,
          currentStageId: scheme.stages[0]?.id || null,
          selectedElementId: null,
          selectedLayerId: null,
        })
      },

      deleteScheme: (id) =>
        set((state) => ({
          schemes: state.schemes.filter((s) => s.id !== id),
          currentSchemeId: state.currentSchemeId === id ? null : state.currentSchemeId,
        })),

      clearCanvas: () => {
        const newStages = createDefaultStages()
        set({
          layers: [],
          stages: newStages,
          currentStageId: newStages[0]?.id || null,
          selectedElementId: null,
          selectedLayerId: null,
        })
      },

      addReviewRecord: (record) => {
        reviewCounter++
        const id = `review-${Date.now()}-${reviewCounter}`
        const now = Date.now()
        const newRecord: ReviewRecord = {
          ...record,
          id,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ reviewRecords: [...state.reviewRecords, newRecord] }))
        return id
      },

      updateReviewRecord: (id, updates) =>
        set((state) => ({
          reviewRecords: state.reviewRecords.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
          ),
        })),

      deleteReviewRecord: (id) =>
        set((state) => {
          const remainingReviews = state.reviewRecords.filter((r) => r.id !== id)
          const remainingCards = state.knowledgeCards.filter((c) => c.reviewId !== id)
          return {
            reviewRecords: remainingReviews,
            knowledgeCards: remainingCards,
          }
        }),

      getReviewsBySchemeId: (schemeId) => {
        return get().reviewRecords.filter((r) => r.schemeId === schemeId)
      },

      addKnowledgeCard: (card) => {
        knowledgeCounter++
        const id = `knowledge-${Date.now()}-${knowledgeCounter}`
        const newCard: KnowledgeCard = {
          ...card,
          id,
          createdAt: Date.now(),
        }
        set((state) => ({ knowledgeCards: [...state.knowledgeCards, newCard] }))
        return id
      },

      deleteKnowledgeCard: (id) =>
        set((state) => ({
          knowledgeCards: state.knowledgeCards.filter((c) => c.id !== id),
        })),

      generateKnowledgeCard: (reviewId) => {
        const review = get().reviewRecords.find((r) => r.id === reviewId)
        if (!review) return null
        const existing = get().knowledgeCards.find((c) => c.reviewId === reviewId)
        if (existing) return existing.id

        const avgTemp =
          review.stageTemps.length > 0
            ? review.stageTemps.reduce((s, t) => s + t.temp, 0) / review.stageTemps.length
            : review.ambientTemp

        const card: Omit<KnowledgeCard, 'id' | 'createdAt'> = {
          reviewId: review.id,
          schemeId: review.schemeId,
          schemeName: review.schemeName,
          moldType: review.moldType,
          defects: review.defects.map((d) => d.type),
          successRate: review.successRate,
          totalThickness: review.totalThickness,
          avgTemp,
          materialCategories: review.materialCategories,
          improvements: review.improvements,
          actualCuringHours: review.actualCuringHours,
          defoamingMethod: review.defoamingMethod,
        }
        return get().addKnowledgeCard(card)
      },

      setShowKnowledgeDrawer: (show) => set({ showKnowledgeDrawer: show }),

      addInventoryMaterial: (material) => {
        inventoryCounter++
        const id = `inv-${Date.now()}-${inventoryCounter}`
        const now = Date.now()
        const newMaterial: InventoryMaterial = {
          ...material,
          id,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ inventoryMaterials: [...state.inventoryMaterials, newMaterial] }))
        return id
      },

      updateInventoryMaterial: (id, updates) =>
        set((state) => ({
          inventoryMaterials: state.inventoryMaterials.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          ),
        })),

      deleteInventoryMaterial: (id) =>
        set((state) => ({
          inventoryMaterials: state.inventoryMaterials.filter((m) => m.id !== id),
        })),

      addQuotation: (quotation) => {
        quotationCounter++
        const id = quotation.id || `quotation-${Date.now()}-${quotationCounter}`
        const newQuotation: Quotation = {
          ...quotation,
          id,
        }
        set((state) => ({ quotations: [...state.quotations, newQuotation] }))
        return id
      },

      updateQuotation: (id, updates) =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: Date.now() } : q
          ),
        })),

      deleteQuotation: (id) =>
        set((state) => ({
          quotations: state.quotations.filter((q) => q.id !== id),
        })),

      addCustomerOrder: (order) => {
        orderCounter++
        const id = order.id || `order-${Date.now()}-${orderCounter}`
        const newOrder: CustomerOrder = {
          ...order,
          id,
        }
        set((state) => ({ customerOrders: [...state.customerOrders, newOrder] }))
        return id
      },

      updateCustomerOrder: (id, updates) =>
        set((state) => ({
          customerOrders: state.customerOrders.map((o) => {
            if (o.id !== id) return o
            const updated = { ...o, ...updates, updatedAt: Date.now() }
            updated.alerts = generateOrderAlerts(updated)
            return updated
          }),
        })),

      deleteCustomerOrder: (id) =>
        set((state) => ({
          customerOrders: state.customerOrders.filter((o) => o.id !== id),
        })),

      advanceOrderStage: (id) =>
        set((state) => ({
          customerOrders: state.customerOrders.map((o) =>
            o.id === id ? advanceStage(o) : o
          ),
        })),

      setCustomerOrderStatus: (id, status) =>
        set((state) => ({
          customerOrders: state.customerOrders.map((o) =>
            o.id === id ? updateOrderStatus(o, status) : o
          ),
        })),

      refreshOrderAlerts: (id) =>
        set((state) => ({
          customerOrders: state.customerOrders.map((o) => {
            if (o.id !== id) return o
            return { ...o, alerts: generateOrderAlerts(o) }
          }),
        })),

      setViewingReviewId: (id) => {
        set({ viewingReviewId: id })
        if (id) {
          set({ showKnowledgeDrawer: false })
        }
      },
    }
  },
    {
      name: 'resin-editor-storage',
      partialize: (state) => ({
        schemes: state.schemes.map(migrateScheme),
        reviewRecords: state.reviewRecords.map(migrateReviewRecord),
        knowledgeCards: state.knowledgeCards.map(migrateKnowledgeCard),
        inventoryMaterials: state.inventoryMaterials.map(migrateInventoryMaterial),
        quotations: state.quotations.map(migrateQuotation),
        customerOrders: state.customerOrders.map(migrateCustomerOrder),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.reviewRecords) {
            state.reviewRecords = []
          }
          if (!state.knowledgeCards) {
            state.knowledgeCards = []
          }
          if (!state.inventoryMaterials) {
            state.inventoryMaterials = []
          }
          if (!state.quotations) {
            state.quotations = []
          }
          if (!state.customerOrders) {
            state.customerOrders = []
          }
          if (!state.schemes) {
            state.schemes = []
          } else {
            state.schemes = state.schemes.map(migrateScheme)
          }
          if (state.reviewRecords.length > 0) {
            state.reviewRecords = state.reviewRecords.map(migrateReviewRecord)
          }
          if (state.knowledgeCards.length > 0) {
            state.knowledgeCards = state.knowledgeCards.map(migrateKnowledgeCard)
          }
          if (state.inventoryMaterials.length > 0) {
            state.inventoryMaterials = state.inventoryMaterials.map(migrateInventoryMaterial)
          }
          if (state.quotations.length > 0) {
            state.quotations = state.quotations.map(migrateQuotation)
          }
          if (state.customerOrders.length > 0) {
            state.customerOrders = state.customerOrders.map(migrateCustomerOrder)
          }
        }
      },
    }
  )
)

export function createMaterialElement(
  layerId: string,
  category: MaterialCategory,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): MaterialElement {
  elementCounter++
  return {
    id: `elem-${Date.now()}-${elementCounter}`,
    layerId,
    category,
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    scale: 1,
    color,
    locked: false,
  }
}
