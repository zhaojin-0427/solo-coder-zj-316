import { useState } from 'react'
import Toolbar from '@/components/Toolbar'
import MoldSelector from '@/components/MoldSelector'
import MaterialLibrary from '@/components/MaterialLibrary'
import MoldCanvas from '@/components/MoldCanvas'
import LayerPanel from '@/components/LayerPanel'
import CuringPanel from '@/components/CuringPanel'
import StageTimeline from '@/components/StageTimeline'
import SimilarCasesPanel from '@/components/SimilarCasesPanel'
import { useStore } from '@/store/useStore'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'

export default function Home() {
  const currentMoldType = useStore((s) => s.currentMoldType)
  const layers = useStore((s) => s.layers)
  const stages = useStore((s) => s.stages)
  const ambientTemp = useStore((s) => s.ambientTemp)
  const knowledgeCards = useStore((s) => s.knowledgeCards)
  const reviewRecords = useStore((s) => s.reviewRecords)

  const [showSimilarPanel, setShowSimilarPanel] = useState(true)

  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div
        className="flex items-center px-4 gap-4"
        style={{ height: 44, background: '#352318', borderBottom: '1px solid rgba(201,169,110,0.15)' }}
      >
        <span className="text-xs" style={{ color: '#8B7355' }}>
          模具类型
        </span>
        <MoldSelector />
      </div>
      <StageTimeline />
      <div className="flex flex-1 min-h-0">
        <MaterialLibrary />
        <div className="flex-1 relative" style={{ background: '#2C1810' }}>
          <MoldCanvas />
        </div>
        <LayerPanel />

        {showSimilarPanel ? (
          <SimilarCasesPanel
            moldType={currentMoldType}
            layers={layers}
            stages={stages}
            ambientTemp={ambientTemp}
            knowledgeCards={knowledgeCards}
            reviewRecords={reviewRecords}
            onOpenKnowledge={() => {}}
          />
        ) : (
          <button
            onClick={() => setShowSimilarPanel(true)}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              width: 24,
              background: '#3D2B1F',
              borderLeft: '1px solid rgba(201,169,110,0.2)',
              color: '#C9A96E',
            }}
            title="展开相似案例提示"
          >
            <ChevronLeft size={16} />
            <Lightbulb size={14} />
          </button>
        )}

        {showSimilarPanel && (
          <button
            onClick={() => setShowSimilarPanel(false)}
            className="absolute right-[260px] top-1/2 -translate-y-1/2 z-10 w-5 h-10 flex items-center justify-center rounded-l-lg"
            style={{
              background: '#3D2B1F',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRight: 'none',
              color: '#8B7355',
            }}
            title="收起相似案例提示"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
      <CuringPanel />
    </div>
  )
}
