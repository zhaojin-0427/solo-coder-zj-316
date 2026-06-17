import { useState } from 'react'
import { MATERIAL_TEMPLATES } from '@/utils/materialTemplates'
import { useStore, createMaterialElement } from '@/store/useStore'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import type { MaterialCategory } from '@/types'

const CATEGORIES: { key: MaterialCategory; label: string }[] = [
  { key: 'driedFlower', label: '干花' },
  { key: 'glitter', label: '亮片' },
  { key: 'goldFoil', label: '金箔' },
  { key: 'colorPowder', label: '色粉' },
]

const CATEGORY_NAMES: Record<MaterialCategory, string> = {
  driedFlower: '干花',
  glitter: '亮片',
  goldFoil: '金箔',
  colorPowder: '色粉',
}

export default function MaterialLibrary() {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('driedFlower')
  const { selectedLayerId, layers, addLayer, addElement, selectLayer, selectElement, currentMoldType } = useStore()

  const handleAddMaterial = (template: (typeof MATERIAL_TEMPLATES)[MaterialCategory][number]) => {
    let layerId = selectedLayerId
    const selectedLayer = layers.find((l) => l.id === layerId)
    if (!layerId || !selectedLayer || selectedLayer.type !== template.category) {
      const matchingLayer = layers.find((l) => l.type === template.category)
      if (matchingLayer) {
        layerId = matchingLayer.id
        selectLayer(layerId)
      } else {
        layerId = addLayer(template.category, `${CATEGORY_NAMES[template.category]}层`)
        selectLayer(layerId)
      }
    }

    const mold = MOLD_SHAPE_MAP[currentMoldType]
    const mw = mold.width
    const mh = mold.height
    const w = template.defaultWidth
    const h = template.defaultHeight
    const rangeX = (mw - w) * 0.6
    const rangeY = (mh - h) * 0.6
    const x = (Math.random() - 0.5) * rangeX
    const y = (Math.random() - 0.5) * rangeY

    const element = createMaterialElement(
      layerId,
      template.category,
      template.name,
      x,
      y,
      w,
      h,
      template.color
    )
    addElement(layerId, element)
    selectElement(element.id)
  }

  const templates = MATERIAL_TEMPLATES[activeCategory]

  return (
    <div
      style={{
        width: 250,
        minWidth: 250,
        background: '#3D2B1F',
        borderRight: '1px solid rgba(201, 169, 110, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        color: '#FFF8F0',
        overflowY: 'auto',
      }}
    >
      <h2 style={{ padding: '16px', margin: 0, fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
        素材库
      </h2>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(201, 169, 110, 0.15)' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: activeCategory === cat.key ? 'rgba(201, 169, 110, 0.2)' : 'transparent',
              color: activeCategory === cat.key ? '#C9A96E' : '#FFF8F0',
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: activeCategory === cat.key ? '2px solid #C9A96E' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: 16,
        }}
      >
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => handleAddMaterial(t)}
            style={{
              background: `${t.color}33`,
              borderRadius: 10,
              padding: '14px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontSize: 12, color: '#FFF8F0' }}>{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
