import Toolbar from '@/components/Toolbar'
import MoldSelector from '@/components/MoldSelector'
import MaterialLibrary from '@/components/MaterialLibrary'
import MoldCanvas from '@/components/MoldCanvas'
import LayerPanel from '@/components/LayerPanel'
import CuringPanel from '@/components/CuringPanel'

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div className="flex items-center px-4 gap-4" style={{ height: 44, background: '#352318', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
        <span className="text-xs" style={{ color: '#8B7355' }}>模具类型</span>
        <MoldSelector />
      </div>
      <div className="flex flex-1 min-h-0">
        <MaterialLibrary />
        <div className="flex-1 relative" style={{ background: '#2C1810' }}>
          <MoldCanvas />
        </div>
        <LayerPanel />
      </div>
      <CuringPanel />
    </div>
  )
}
