import type { MoldShape, MoldType } from '../types'

const pendantShape: MoldShape = {
  type: 'pendant',
  label: '吊坠',
  path: (cx, cy, size) => {
    const topY = cy - size * 0.45
    const bottomY = cy + size * 0.5
    const midY = cy + size * 0.1
    const leftX = cx - size * 0.3
    const rightX = cx + size * 0.3
    return `M ${cx} ${topY} C ${cx + size * 0.35} ${topY + size * 0.1} ${rightX + size * 0.05} ${midY - size * 0.15} ${rightX} ${midY} C ${rightX - size * 0.02} ${midY + size * 0.15} ${cx + size * 0.15} ${bottomY - size * 0.1} ${cx} ${bottomY} C ${cx - size * 0.15} ${bottomY - size * 0.1} ${leftX + size * 0.02} ${midY + size * 0.15} ${leftX} ${midY} C ${leftX - size * 0.05} ${midY - size * 0.15} ${cx - size * 0.35} ${topY + size * 0.1} ${cx} ${topY} Z`
  },
  width: 60,
  height: 90,
  areaMm2: 60 * 90 * 0.55,
}

const hairclipShape: MoldShape = {
  type: 'hairclip',
  label: '发夹',
  path: (cx, cy, size) => {
    const w = size * 0.5
    const h = size * 0.2
    const rx = h * 0.5
    const left = cx - w
    const right = cx + w
    const top = cy - h
    const bottom = cy + h
    return `M ${left + rx} ${top} L ${right - rx} ${top} A ${rx} ${rx} 0 0 1 ${right} ${top + rx} L ${right} ${bottom - rx} A ${rx} ${rx} 0 0 1 ${right - rx} ${bottom} L ${left + rx} ${bottom} A ${rx} ${rx} 0 0 1 ${left} ${bottom - rx} L ${left} ${top + rx} A ${rx} ${rx} 0 0 1 ${left + rx} ${top} Z`
  },
  width: 100,
  height: 40,
  areaMm2: 100 * 40 * 0.85,
}

const ringShape: MoldShape = {
  type: 'ring',
  label: '戒指托',
  path: (cx, cy, size) => {
    const outerR = size * 0.4
    const innerR = size * 0.25
    return `M ${cx + outerR} ${cy} A ${outerR} ${outerR} 0 1 0 ${cx - outerR} ${cy} A ${outerR} ${outerR} 0 1 0 ${cx + outerR} ${cy} Z M ${cx + innerR} ${cy} A ${innerR} ${innerR} 0 1 1 ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 1 ${cx + innerR} ${cy} Z`
  },
  width: 80,
  height: 80,
  areaMm2: Math.PI * (40 * 40 - 25 * 25),
}

const coasterShape: MoldShape = {
  type: 'coaster',
  label: '杯垫',
  path: (cx, cy, size) => {
    const r = size * 0.45
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z`
  },
  width: 120,
  height: 120,
  areaMm2: Math.PI * 54 * 54,
}

export const MOLD_SHAPE_MAP: Record<MoldType, MoldShape> = {
  pendant: pendantShape,
  hairclip: hairclipShape,
  ring: ringShape,
  coaster: coasterShape,
}
