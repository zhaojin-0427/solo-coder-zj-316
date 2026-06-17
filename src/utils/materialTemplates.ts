import type { MaterialCategory, MaterialTemplate } from '../types'

const driedFlowerTemplates: MaterialTemplate[] = [
  { id: 'df-1', category: 'driedFlower', name: '小雏菊', defaultWidth: 20, defaultHeight: 20, color: '#F5D76E', icon: '🌼' },
  { id: 'df-2', category: 'driedFlower', name: '玫瑰花瓣', defaultWidth: 25, defaultHeight: 18, color: '#E888A0', icon: '🌹' },
  { id: 'df-3', category: 'driedFlower', name: '薰衣草', defaultWidth: 15, defaultHeight: 25, color: '#9B7BB8', icon: '💜' },
  { id: 'df-4', category: 'driedFlower', name: '满天星', defaultWidth: 18, defaultHeight: 18, color: '#F0E6F6', icon: '✿' },
  { id: 'df-5', category: 'driedFlower', name: '绣球花', defaultWidth: 28, defaultHeight: 28, color: '#C8A2D3', icon: '🌸' },
]

const glitterTemplates: MaterialTemplate[] = [
  { id: 'gl-1', category: 'glitter', name: '银色亮片', defaultWidth: 12, defaultHeight: 12, color: '#C0C0C0', icon: '✨' },
  { id: 'gl-2', category: 'glitter', name: '金色亮片', defaultWidth: 12, defaultHeight: 12, color: '#FFD700', icon: '✨' },
  { id: 'gl-3', category: 'glitter', name: '彩虹亮片', defaultWidth: 14, defaultHeight: 14, color: '#FF69B4', icon: '🌈' },
  { id: 'gl-4', category: 'glitter', name: '星光亮片', defaultWidth: 10, defaultHeight: 10, color: '#FFB6C1', icon: '⭐' },
  { id: 'gl-5', category: 'glitter', name: '人鱼亮片', defaultWidth: 14, defaultHeight: 14, color: '#40E0D0', icon: '🧜' },
]

const goldFoilTemplates: MaterialTemplate[] = [
  { id: 'gf-1', category: 'goldFoil', name: '金箔碎片', defaultWidth: 10, defaultHeight: 10, color: '#DAA520', icon: '🪙' },
  { id: 'gf-2', category: 'goldFoil', name: '金箔叶形', defaultWidth: 15, defaultHeight: 12, color: '#FFC125', icon: '🍃' },
  { id: 'gf-3', category: 'goldFoil', name: '金箔星形', defaultWidth: 12, defaultHeight: 12, color: '#E8B830', icon: '⭐' },
  { id: 'gf-4', category: 'goldFoil', name: '银箔碎片', defaultWidth: 10, defaultHeight: 10, color: '#A8A9AD', icon: '🪙' },
  { id: 'gf-5', category: 'goldFoil', name: '玫瑰金箔', defaultWidth: 12, defaultHeight: 12, color: '#B76E79', icon: '🌹' },
]

const colorPowderTemplates: MaterialTemplate[] = [
  { id: 'cp-1', category: 'colorPowder', name: '珊瑚粉', defaultWidth: 16, defaultHeight: 16, color: '#F88379', icon: '🪸' },
  { id: 'cp-2', category: 'colorPowder', name: '天空蓝', defaultWidth: 16, defaultHeight: 16, color: '#87CEEB', icon: '☁️' },
  { id: 'cp-3', category: 'colorPowder', name: '薄荷绿', defaultWidth: 16, defaultHeight: 16, color: '#98FB98', icon: '🌿' },
  { id: 'cp-4', category: 'colorPowder', name: '紫罗兰', defaultWidth: 16, defaultHeight: 16, color: '#EE82EE', icon: '💜' },
  { id: 'cp-5', category: 'colorPowder', name: '琥珀橙', defaultWidth: 16, defaultHeight: 16, color: '#FFBF00', icon: '🔶' },
]

export const MATERIAL_TEMPLATES: Record<MaterialCategory, MaterialTemplate[]> = {
  driedFlower: driedFlowerTemplates,
  glitter: glitterTemplates,
  goldFoil: goldFoilTemplates,
  colorPowder: colorPowderTemplates,
}
