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
} from '../types'

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
          name: name || `${type === 'driedFlower' ? '干花' : type === 'glitter' ? '亮片' : type === 'goldFoil' ? '金箔' : '色粉'}层 ${layerCounter}`,
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.reviewRecords) {
            state.reviewRecords = []
          }
          if (!state.knowledgeCards) {
            state.knowledgeCards = []
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
