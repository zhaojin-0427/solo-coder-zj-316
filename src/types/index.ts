export type MoldType = 'pendant' | 'hairclip' | 'ring' | 'coaster'
export type MaterialCategory = 'driedFlower' | 'glitter' | 'goldFoil' | 'colorPowder'
export type StageType = 'base' | 'material' | 'sealant' | 'correction'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Stage {
  id: string
  name: string
  type: StageType
  order: number
  layerIds: string[]
  glueMl: number
  thickness: number
  waitHours: number
  ambientTemp: number
  materialBatch: string
  notes: string
}

export interface StageCuringInfo {
  stageId: string
  stageName: string
  stageType: StageType
  hours: number
  thickness: number
  resinMl: number
  ambientTemp: number
  riskLevel: RiskLevel
  riskMessages: string[]
  suggestions: string[]
}

export interface StageComparisonData {
  stageName: string
  stageType: StageType
  resinDiff: number
  hoursDiff: number
  thicknessDiff: number
  tempDiff: number
  risksA: string[]
  risksB: string[]
}

export interface SchemeComparison {
  schemeAName: string
  schemeBName: string
  totalResinDiff: number
  totalHoursDiff: number
  totalThicknessDiff: number
  totalMaterialDiff: { category: MaterialCategory; countA: number; countB: number; diff: number }[]
  stageComparisons: StageComparisonData[]
  riskDiff: { levelA: RiskLevel; levelB: RiskLevel; countA: number; countB: number }
}

export interface Scheme {
  id: string
  name: string
  moldType: MoldType
  layers: Layer[]
  stages: Stage[]
  ambientTemp: number
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
  totalThickness: number
  layerDetails: LayerCuringInfo[]
  stageDetails: StageCuringInfo[]
  warnings: Warning[]
  overallRisk: RiskLevel
  nextSuggestion: string
  currentStageRisk?: { stageId: string; stageName: string; level: RiskLevel; messages: string[] }
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
