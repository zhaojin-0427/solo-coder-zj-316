import { useStore } from '@/store/useStore'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import type { MoldType } from '@/types'
import { Gem, Paperclip, Circle, Coffee } from 'lucide-react'

const MOLD_OPTIONS: { type: MoldType; label: string; icon: React.ReactNode }[] = [
  { type: 'pendant', label: '吊坠', icon: <Gem size={18} /> },
  { type: 'hairclip', label: '发夹', icon: <Paperclip size={18} /> },
  { type: 'ring', label: '戒指托', icon: <Circle size={18} /> },
  { type: 'coaster', label: '杯垫', icon: <Coffee size={18} /> },
]

export default function MoldSelector() {
  const currentMoldType = useStore((s) => s.currentMoldType)
  const setMoldType = useStore((s) => s.setMoldType)

  return (
    <div className="flex items-center gap-2">
      {MOLD_OPTIONS.map((opt) => {
        const isActive = currentMoldType === opt.type
        return (
          <button
            key={opt.type}
            onClick={() => setMoldType(opt.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: isActive ? 'rgba(201,169,110,0.25)' : 'rgba(0,0,0,0.2)',
              color: isActive ? '#C9A96E' : '#8B7355',
              border: isActive ? '1px solid rgba(201,169,110,0.4)' : '1px solid transparent',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
