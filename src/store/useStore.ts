import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MoldType, Layer, MaterialElement, Scheme, MaterialCategory } from '../types'

interface EditorState {
  currentMoldType: MoldType
  layers: Layer[]
  selectedElementId: string | null
  selectedLayerId: string | null
  schemes: Scheme[]
  currentSchemeId: string | null

  setMoldType: (type: MoldType) => void
  addLayer: (type: MaterialCategory, name: string) => string
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  addElement: (layerId: string, element: MaterialElement) => void
  removeElement: (id: string) => void
  updateElement: (id: string, updates: Partial<MaterialElement>) => void
  selectElement: (id: string | null) => void
  selectLayer: (id: string | null) => void
  saveScheme: (name: string) => void
  loadScheme: (id: string) => void
  deleteScheme: (id: string) => void
  clearCanvas: () => void
}

let layerCounter = 0
let elementCounter = 0

export const useStore = create<EditorState>()(
  persist(
    (set, get) => ({
      currentMoldType: 'pendant',
      layers: [],
      selectedElementId: null,
      selectedLayerId: null,
      schemes: [],
      currentSchemeId: null,

      setMoldType: (type) => set({ currentMoldType: type }),

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

      saveScheme: (name) => {
        const state = get()
        const scheme: Scheme = {
          id: `scheme-${Date.now()}`,
          name,
          moldType: state.currentMoldType,
          layers: JSON.parse(JSON.stringify(state.layers)),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          schemes: [...state.schemes, scheme],
          currentSchemeId: scheme.id,
        }))
      },

      loadScheme: (id) => {
        const scheme = get().schemes.find((s) => s.id === id)
        if (scheme) {
          set({
            currentMoldType: scheme.moldType,
            layers: JSON.parse(JSON.stringify(scheme.layers)),
            currentSchemeId: id,
            selectedElementId: null,
            selectedLayerId: null,
          })
        }
      },

      deleteScheme: (id) =>
        set((state) => ({
          schemes: state.schemes.filter((s) => s.id !== id),
          currentSchemeId: state.currentSchemeId === id ? null : state.currentSchemeId,
        })),

      clearCanvas: () =>
        set({ layers: [], selectedElementId: null, selectedLayerId: null }),
    }),
    {
      name: 'resin-editor-storage',
      partialize: (state) => ({
        schemes: state.schemes,
      }),
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
