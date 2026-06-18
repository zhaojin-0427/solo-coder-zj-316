import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Image, CheckCircle } from 'lucide-react'
import type {
  ReviewRecord,
  DefectItem,
  DefectType,
  DefoamingMethod,
  SuccessRate,
  MoldType,
  MaterialCategory,
  Stage,
  Layer,
} from '../types'
import {
  DEFECT_LIBRARY,
  DEFOAMING_METHODS,
  SUCCESS_RATE_LABELS,
  getDefectLabel,
  getDefectIcon,
} from '../utils/defectLibrary'
import { MOLD_SHAPE_MAP } from '../utils/moldShapes'
import { MATERIAL_TEMPLATES } from '../utils/materialTemplates'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (record: Omit<ReviewRecord, 'id' | 'createdAt' | 'updatedAt'>) => void
  editRecord?: ReviewRecord | null
  schemeId: string
  schemeName: string
  moldType: MoldType
  layers: Layer[]
  stages: Stage[]
  ambientTemp: number
}

const SEVERITY_OPTIONS = [
  { value: 'mild', label: '轻微', color: '#6B8E6B' },
  { value: 'moderate', label: '中等', color: '#F59E0B' },
  { value: 'severe', label: '严重', color: '#EF4444' },
] as const

export default function ReviewEditor({
  open,
  onClose,
  onSave,
  editRecord,
  schemeId,
  schemeName,
  moldType,
  layers,
  stages,
  ambientTemp,
}: Props) {
  const [actualStatus, setActualStatus] = useState('')
  const [defects, setDefects] = useState<DefectItem[]>([])
  const [actualCuringHours, setActualCuringHours] = useState(24)
  const [ambientHumidity, setAmbientHumidity] = useState(50)
  const [temp, setTemp] = useState(25)
  const [abRatio, setAbRatio] = useState('3:1')
  const [defoamingMethod, setDefoamingMethod] = useState<DefoamingMethod>('none')
  const [demoldTime, setDemoldTime] = useState(24)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoNotes, setPhotoNotes] = useState('')
  const [improvements, setImprovements] = useState('')
  const [successRate, setSuccessRate] = useState<SuccessRate>('good')
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [showDefectPicker, setShowDefectPicker] = useState(false)

  const totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0)
  const materialCategories = [...new Set(layers.map((l) => l.type))]
  const stageTemps = stages.map((s) => ({
    stageId: s.id,
    stageName: s.name,
    temp: s.ambientTemp,
  }))

  useEffect(() => {
    if (editRecord) {
      setActualStatus(editRecord.actualStatus || '')
      setDefects(editRecord.defects || [])
      setActualCuringHours(editRecord.actualCuringHours || 24)
      setAmbientHumidity(editRecord.ambientHumidity || 50)
      setTemp(editRecord.ambientTemp || 25)
      setAbRatio(editRecord.abRatio || '3:1')
      setDefoamingMethod(editRecord.defoamingMethod || 'none')
      setDemoldTime(editRecord.demoldTime || 24)
      setPhotoUrls(editRecord.photoUrls || [])
      setPhotoNotes(editRecord.photoNotes || '')
      setImprovements(editRecord.improvements || '')
      setSuccessRate(editRecord.successRate || 'good')
    } else {
      setActualStatus('')
      setDefects([])
      setActualCuringHours(stages.reduce((sum, s) => sum + s.waitHours, 0) || 24)
      setAmbientHumidity(50)
      setTemp(ambientTemp)
      setAbRatio('3:1')
      setDefoamingMethod('none')
      setDemoldTime(24)
      setPhotoUrls([])
      setPhotoNotes('')
      setImprovements('')
      setSuccessRate('good')
    }
  }, [editRecord, open, stages, ambientTemp])

  const handleAddDefect = (type: DefectType) => {
    if (defects.some((d) => d.type === type)) return
    setDefects([...defects, { type, severity: 'mild', description: '' }])
    setShowDefectPicker(false)
  }

  const handleRemoveDefect = (type: DefectType) => {
    setDefects(defects.filter((d) => d.type !== type))
  }

  const handleUpdateDefectSeverity = (type: DefectType, severity: 'mild' | 'moderate' | 'severe') => {
    setDefects(defects.map((d) => (d.type === type ? { ...d, severity } : d)))
  }

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotoUrls([...photoUrls, newPhotoUrl.trim()])
      setNewPhotoUrl('')
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({
      schemeId,
      schemeName,
      moldType,
      actualStatus,
      defects,
      actualCuringHours,
      ambientTemp: temp,
      ambientHumidity,
      abRatio,
      defoamingMethod,
      demoldTime,
      photoUrls,
      photoNotes,
      improvements,
      successRate,
      totalThickness,
      materialCategories,
      stageTemps,
    })
    onClose()
  }

  if (!open) return null

  const availableDefects = Object.keys(DEFECT_LIBRARY).filter(
    (d) => !defects.some((def) => def.type === d)
  ) as DefectType[]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} style={{ color: '#C9A96E' }} />
            <h3 className="font-display text-lg font-bold" style={{ color: '#C9A96E' }}>
              {editRecord ? '编辑复盘记录' : '创建复盘记录'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: '#8B7355' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>方案名称</label>
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}>
                {schemeName}
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>模具类型</label>
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', color: '#FFF8F0' }}>
                {MOLD_SHAPE_MAP[moldType]?.label || moldType}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>实际成品状态</label>
            <textarea
              value={actualStatus}
              onChange={(e) => setActualStatus(e.target.value)}
              placeholder="描述成品的实际效果、整体感受..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)', minHeight: 60 }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs" style={{ color: '#8B7355' }}>缺陷 / 瑕疵类型</label>
              <button
                onClick={() => setShowDefectPicker(!showDefectPicker)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E' }}
              >
                <Plus size={12} />
                添加缺陷
              </button>
            </div>

            {showDefectPicker && (
              <div
                className="rounded-lg p-3 mb-3 grid grid-cols-3 gap-2"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.2)' }}
              >
                {availableDefects.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleAddDefect(d)}
                    className="flex items-center gap-2 p-2 rounded text-xs text-left"
                    style={{ background: 'rgba(201,169,110,0.1)', color: '#FFF8F0' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.1)')}
                  >
                    <span>{getDefectIcon(d)}</span>
                    <span>{getDefectLabel(d)}</span>
                  </button>
                ))}
                {availableDefects.length === 0 && (
                  <div className="col-span-3 text-center text-xs py-2" style={{ color: '#8B7355' }}>
                    所有缺陷类型已添加
                  </div>
                )}
              </div>
            )}

            {defects.length === 0 && (
              <div className="text-xs py-4 text-center rounded-lg" style={{ color: '#8B7355', background: 'rgba(0,0,0,0.15)' }}>
                暂无缺陷记录，点击上方按钮添加
              </div>
            )}

            {defects.length > 0 && (
              <div className="space-y-2">
                {defects.map((defect) => (
                  <div
                    key={defect.type}
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid rgba(239,68,68,0.2)` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getDefectIcon(defect.type)}</span>
                        <span className="text-sm font-medium" style={{ color: '#FFF8F0' }}>
                          {getDefectLabel(defect.type)}
                        </span>
                      </div>
                      <button onClick={() => handleRemoveDefect(defect.type)} style={{ color: '#8B7355' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs" style={{ color: '#8B7355' }}>严重程度:</span>
                      {SEVERITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleUpdateDefectSeverity(defect.type, opt.value)}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: defect.severity === opt.value ? `${opt.color}25` : 'transparent',
                            color: defect.severity === opt.value ? opt.color : '#8B7355',
                            border: `1px solid ${defect.severity === opt.value ? opt.color : 'transparent'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={defect.description}
                      onChange={(e) => {
                        setDefects(
                          defects.map((d) =>
                            d.type === defect.type ? { ...d, description: e.target.value } : d
                          )
                        )
                      }}
                      placeholder="补充描述..."
                      className="w-full text-xs rounded px-2 py-1.5 outline-none"
                      style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.15)' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>实际固化耗时 (小时)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={actualCuringHours}
                onChange={(e) => setActualCuringHours(parseFloat(e.target.value) || 0)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>脱模时间 (小时)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={demoldTime}
                onChange={(e) => setDemoldTime(parseFloat(e.target.value) || 0)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>环境温度 (°C)</label>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>环境湿度 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={ambientHumidity}
                onChange={(e) => setAmbientHumidity(parseFloat(e.target.value) || 0)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>AB胶比例</label>
              <input
                type="text"
                value={abRatio}
                onChange={(e) => setAbRatio(e.target.value)}
                placeholder="如 3:1"
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>消泡方式</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DEFOAMING_METHODS) as DefoamingMethod[]).map((method) => {
                const info = DEFOAMING_METHODS[method]
                const isActive = defoamingMethod === method
                return (
                  <button
                    key={method}
                    onClick={() => setDefoamingMethod(method)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                    style={{
                      background: isActive ? 'rgba(201,169,110,0.25)' : 'rgba(0,0,0,0.2)',
                      color: isActive ? '#C9A96E' : '#8B7355',
                      border: `1px solid ${isActive ? 'rgba(201,169,110,0.4)' : 'rgba(201,169,110,0.15)'}`,
                    }}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>成品成功率</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SUCCESS_RATE_LABELS) as SuccessRate[]).map((rate) => {
                const info = SUCCESS_RATE_LABELS[rate]
                const isActive = successRate === rate
                return (
                  <button
                    key={rate}
                    onClick={() => setSuccessRate(rate)}
                    className="px-3 py-1.5 rounded-full text-xs"
                    style={{
                      background: isActive ? `${info.color}20` : 'rgba(0,0,0,0.2)',
                      color: isActive ? info.color : '#8B7355',
                      border: `1px solid ${isActive ? `${info.color}60` : 'rgba(201,169,110,0.15)'}`,
                    }}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>照片链接</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="输入图片链接..."
                className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)' }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPhoto()}
              />
              <button
                onClick={handleAddPhoto}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <div
                      className="w-16 h-16 rounded flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,169,110,0.15)' }}
                    >
                      <Image size={20} style={{ color: '#8B7355' }} />
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#EF4444', color: '#fff' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>照片备注</label>
            <textarea
              value={photoNotes}
              onChange={(e) => setPhotoNotes(e.target.value)}
              placeholder="照片相关说明..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)', minHeight: 50 }}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#8B7355' }}>改进建议</label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="下次如何改进？有什么经验教训？..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.25)', minHeight: 80 }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid rgba(201,169,110,0.15)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            {editRecord ? '保存修改' : '创建复盘'}
          </button>
        </div>
      </div>
    </div>
  )
}
