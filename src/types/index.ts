export type MoldType = 'pendant' | 'hairclip' | 'ring' | 'coaster'
export type MaterialCategory = 'driedFlower' | 'glitter' | 'goldFoil' | 'colorPowder'

export interface Scheme {
  id: string
  name: string
  moldType: MoldType
  layers: Layer[]
  createdAt: number
  updatedAt: number
}

export interface Layer {
  id: string
  name: string
  type: MaterialCategory
  order: number
  opacity: number
  thickness: number
  locked: boolean
  elements: MaterialElement[]
}

export interface MaterialElement {
  id: string
  layerId: string
  category: MaterialCategory
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  color: string
  locked: boolean
}

export interface CuringEstimate {
  totalHours: number
  totalResinMl: number
  layerDetails: LayerCuringInfo[]
  warnings: Warning[]
}

export interface LayerCuringInfo {
  layerId: string
  layerName: string
  hours: number
  thickness: number
  resinMl: number
}

export interface Warning {
  type: 'occlusion' | 'bubble' | 'gravity'
  level: 'info' | 'warning' | 'danger'
  message: string
  layerId?: string
}

export interface MaterialTemplate {
  id: string
  category: MaterialCategory
  name: string
  defaultWidth: number
  defaultHeight: number
  color: string
  icon: string
}

export interface MoldShape {
  type: MoldType
  label: string
  path: (cx: number, cy: number, size: number) => string
  width: number
  height: number
  areaMm2: number
}

export interface StepCardItem {
  stepNumber: number
  layerName: string
  layerType: MaterialCategory
  thickness: number
  resinMl: number
  curingHours: number
  elementCount: number
  elementNames: string[]
  tips: string[]
}
