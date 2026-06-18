import type { DefectType, DefoamingMethod, SuccessRate, MaterialCategory } from '../types'

export const DEFECT_LIBRARY: Record<DefectType, {
  label: string
  icon: string
  description: string
  commonCauses: string[]
  preventionMethods: string[]
  repairMethods: string[]
}> = {
  bubble: {
    label: '气泡',
    icon: '🫧',
    description: '胶体内存在大小不一的气泡，影响透明度和美观',
    commonCauses: [
      '搅拌速度过快卷入空气',
      '材料放置后未充分消泡',
      '亮片/金箔等材料表面携带空气',
      '环境湿度过高',
      '胶液粘稠度过高',
    ],
    preventionMethods: [
      '缓慢搅拌胶液，沿杯壁刮匀',
      '搅拌后静置5-10分钟消泡',
      '使用热风枪表面快速加热',
      '亮片等材料提前浸润',
      '可使用真空消泡机处理',
    ],
    repairMethods: [
      '表面小气泡可用牙签挑破',
      '热风枪快速扫过表面',
      '严重时可打磨后补胶',
    ],
  },
  fogging: {
    label: '发雾',
    icon: '🌫️',
    description: '胶体表面或整体呈现白雾状，透明度下降',
    commonCauses: [
      '环境温度过低固化缓慢',
      '环境湿度过高',
      'AB胶比例不准确',
      '搅拌不均匀',
      '低温环境下快速固化',
    ],
    preventionMethods: [
      '保持环境温度20-28°C',
      '控制环境湿度在60%以下',
      '严格按比例称量AB胶',
      '充分搅拌至完全透明',
      '低温环境可适当延长固化时间',
    ],
    repairMethods: [
      '轻微发雾可打磨抛光',
      '表面喷涂清漆恢复光泽',
      '严重时需重新制作',
    ],
  },
  cracking: {
    label: '开裂',
    icon: '💔',
    description: '胶体出现裂纹，可能是表面裂纹或深层开裂',
    commonCauses: [
      '单次浇筑厚度过大放热剧烈',
      '环境温度骤变',
      '固化时间不足强行脱模',
      '材料应力集中',
      'AB胶比例偏差过大',
    ],
    preventionMethods: [
      '分多次薄层浇筑，每层不超过3mm',
      '避免温度剧烈变化',
      '确保完全固化后再脱模',
      '避免尖锐材料造成应力集中',
      '严格按比例调配胶液',
    ],
    repairMethods: [
      '细小裂纹可注入胶水填补',
      '表面打磨后封胶处理',
      '严重开裂无法修复',
    ],
  },
  delamination: {
    label: '分层',
    icon: '📑',
    description: '不同胶层之间出现分离现象，层间可见缝隙',
    commonCauses: [
      '前一层完全固化后再加层',
      '层间有灰尘或油污',
      '层间未做打磨处理',
      '两层胶固化速度差异过大',
      '脱模剂残留',
    ],
    preventionMethods: [
      '在前层初固（约6-8小时）时加层',
      '层间清洁干净，无灰尘油污',
      '加层前轻磨表面增加附着力',
      '避免使用脱模剂过多',
      '确保每层胶液充分接触',
    ],
    repairMethods: [
      '轻微分层可注入胶水',
      '严重分层需重新制作',
    ],
  },
  materialDrift: {
    label: '材料漂移',
    icon: '🌊',
    description: '放置的材料（干花、亮片等）在胶液中移位或漂浮',
    commonCauses: [
      '胶液过稀材料易漂浮',
      '材料密度小于胶体',
      '固化时间过长材料沉降',
      '浇筑时胶液冲击材料',
      '材料未预先固定',
    ],
    preventionMethods: [
      '先刷薄层胶固定材料',
      '等胶液稍微粘稠后再放材料',
      '分层浇筑，材料放中间层',
      '使用镊子轻压材料入胶',
      '避免直接冲浇材料表面',
    ],
    repairMethods: [
      '初固前可用工具调整位置',
      '完全固化后无法修复',
    ],
  },
  pigmentSettling: {
    label: '色粉沉淀',
    icon: '🧪',
    description: '色粉或珠光粉沉降到底部，颜色分布不均',
    commonCauses: [
      '色粉未充分混合',
      '色粉颗粒过粗',
      '固化时间过长',
      '胶液过于粘稠混合不均',
      '色粉添加量过多',
    ],
    preventionMethods: [
      '色粉先与少量胶液预混合',
      '使用细颗粒色粉',
      '分次添加，每次充分搅拌',
      '控制色粉添加比例',
      '可加入分散剂辅助',
    ],
    repairMethods: [
      '表面沉淀可打磨去除',
      '整体沉淀无法修复',
    ],
  },
  surfaceDimple: {
    label: '表面凹陷',
    icon: '🕳️',
    description: '固化后表面出现小坑或凹陷，不平整',
    commonCauses: [
      '表面气泡破裂后未流平',
      '胶液表面张力问题',
      '模具表面有缺陷',
      '环境灰尘落入',
      '固化时震动',
    ],
    preventionMethods: [
      '充分消泡后再静置固化',
      '使用质量好的硅胶模具',
      '保持环境清洁无尘',
      '固化过程中避免震动',
      '可在表面薄薄封一层胶',
    ],
    repairMethods: [
      '小凹陷可补胶填平',
      '打磨后抛光处理',
    ],
  },
  yellowing: {
    label: '黄变',
    icon: '🟡',
    description: '胶体逐渐变黄，透明度下降',
    commonCauses: [
      '紫外线照射老化',
      '使用劣质滴胶',
      '高温加速黄变',
      '某些色浆导致黄变',
      '时间久了自然老化',
    ],
    preventionMethods: [
      '选择抗UV滴胶',
      '避免阳光直射',
      '存储在阴凉处',
      '可添加UV吸收剂',
      '选择优质AB胶品牌',
    ],
    repairMethods: [
      '轻微黄变可用紫外线处理',
      '严重黄变无法修复',
    ],
  },
  shrinkage: {
    label: '收缩',
    icon: '📉',
    description: '胶体固化后收缩，边缘脱离模具或尺寸变小',
    commonCauses: [
      'AB胶比例不准确',
      '固化温度过高',
      '胶液本身收缩率大',
      '固化时间不足',
      '厚层浇筑收缩明显',
    ],
    preventionMethods: [
      '严格按比例调配',
      '控制固化温度不要过高',
      '选择低收缩率滴胶',
      '分薄层浇筑',
      '确保完全固化后脱模',
    ],
    repairMethods: [
      '边缘收缩可补胶',
      '整体收缩无法修复',
    ],
  },
  other: {
    label: '其他',
    icon: '❓',
    description: '其他未分类的缺陷',
    commonCauses: ['各种未知因素'],
    preventionMethods: ['仔细操作，积累经验'],
    repairMethods: ['根据具体情况处理'],
  },
}

export const DEFOAMING_METHODS: Record<DefoamingMethod, { label: string; icon: string; effectiveness: number }> = {
  none: { label: '未消泡', icon: '❌', effectiveness: 0 },
  stillStanding: { label: '静置消泡', icon: '⏳', effectiveness: 1 },
  stirSlowly: { label: '缓慢搅拌', icon: '🥄', effectiveness: 2 },
  toothpick: { label: '牙签挑破', icon: '🪥', effectiveness: 2 },
  heatGun: { label: '热风枪', icon: '🔥', effectiveness: 4 },
  vacuum: { label: '真空消泡', icon: '🫙', effectiveness: 5 },
}

export const SUCCESS_RATE_LABELS: Record<SuccessRate, { label: string; color: string; score: number }> = {
  perfect: { label: '完美', color: '#6B8E6B', score: 5 },
  good: { label: '良好', color: '#4A90B8', score: 4 },
  average: { label: '一般', color: '#F59E0B', score: 3 },
  poor: { label: '较差', color: '#EF4444', score: 2 },
  failed: { label: '失败', color: '#8B0000', score: 1 },
}

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  driedFlower: '干花',
  glitter: '亮片',
  goldFoil: '金箔',
  colorPowder: '色粉',
}

export function getDefectLabel(type: DefectType): string {
  return DEFECT_LIBRARY[type]?.label || type
}

export function getDefectIcon(type: DefectType): string {
  return DEFECT_LIBRARY[type]?.icon || '❓'
}

export function getDefoamingLabel(method: DefoamingMethod): string {
  return DEFOAMING_METHODS[method]?.label || method
}

export function getSuccessRateLabel(rate: SuccessRate): string {
  return SUCCESS_RATE_LABELS[rate]?.label || rate
}

export function getSuccessRateColor(rate: SuccessRate): string {
  return SUCCESS_RATE_LABELS[rate]?.color || '#8B7355'
}

export function getMaterialCategoryLabel(cat: MaterialCategory): string {
  return MATERIAL_CATEGORY_LABELS[cat] || cat
}

export const TEMP_RANGES = [
  { label: '低温 (<15°C)', min: -10, max: 15 },
  { label: '常温 (15-25°C)', min: 15, max: 25 },
  { label: '温暖 (25-30°C)', min: 25, max: 30 },
  { label: '高温 (>30°C)', min: 30, max: 50 },
]
