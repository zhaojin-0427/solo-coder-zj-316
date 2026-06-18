import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { InventoryCategory, InventoryMaterial, CostWarning } from '@/types'
import { CATEGORY_LABELS, estimateCost } from '@/utils/costCalculator'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import {
  X,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  AlertOctagon,
  Info,
  Search,
  Package,
  DollarSign,
  Beaker,
  TrendingUp,
} from 'lucide-react'

const INVENTORY_CATEGORIES: { key: InventoryCategory; label: string; icon: string }[] = [
  { key: 'driedFlower', label: '干花', icon: '🌼' },
  { key: 'glitter', label: '亮片', icon: '✨' },
  { key: 'goldFoil', label: '金箔', icon: '🪙' },
  { key: 'colorPowder', label: '色粉', icon: '🎨' },
  { key: 'abGlue', label: 'AB胶', icon: '🧪' },
  { key: 'moldSupply', label: '模具耗材', icon: '📦' },
]

const EMPTY_MATERIAL: Omit<InventoryMaterial, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'abGlue',
  spec: '',
  unit: 'g',
  purchasePrice: 0,
  currentStock: 0,
  minWarning: 0,
  supplier: '',
  batchNo: '',
  expiryDate: '',
  notes: '',
}

function warningIcon(type: string) {
  switch (type) {
    case 'lowStock':
      return <AlertTriangle size={13} />
    case 'nearExpiry':
      return <AlertOctagon size={13} />
    case 'batchMismatch':
      return <Info size={13} />
    case 'highCost':
      return <DollarSign size={13} />
    default:
      return <Info size={13} />
  }
}

function warningColor(level: string) {
  switch (level) {
    case 'danger':
      return '#EF4444'
    case 'warning':
      return '#F59E0B'
    default:
      return '#60A5FA'
  }
}

interface Props {
  open: boolean
  onClose: () => void
  onOpenQuotation: () => void
}

export default function InventoryPanel({ open, onClose, onOpenQuotation }: Props) {
  const inventoryMaterials = useStore((s) => s.inventoryMaterials)
  const addInventoryMaterial = useStore((s) => s.addInventoryMaterial)
  const updateInventoryMaterial = useStore((s) => s.updateInventoryMaterial)
  const deleteInventoryMaterial = useStore((s) => s.deleteInventoryMaterial)
  const layers = useStore((s) => s.layers)
  const stages = useStore((s) => s.stages)
  const currentMoldType = useStore((s) => s.currentMoldType)

  const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_MATERIAL)
  const [showCostPanel, setShowCostPanel] = useState(false)

  const filteredMaterials = useMemo(() => {
    let list = inventoryMaterials
    if (filterCategory !== 'all') {
      list = list.filter((m) => m.category === filterCategory)
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(kw) ||
          m.supplier.toLowerCase().includes(kw) ||
          m.batchNo.toLowerCase().includes(kw)
      )
    }
    return list
  }, [inventoryMaterials, filterCategory, searchText])

  const moldShape = MOLD_SHAPE_MAP[currentMoldType]
  const costEstimate = useMemo(() => {
    if (layers.length === 0) return null
    return estimateCost(layers, stages, moldShape.areaMm2, inventoryMaterials)
  }, [layers, stages, moldShape.areaMm2, inventoryMaterials])

  const lowStockCount = useMemo(() => {
    return inventoryMaterials.filter((m) => m.currentStock <= m.minWarning).length
  }, [inventoryMaterials])

  const nearExpiryCount = useMemo(() => {
    const now = Date.now()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    return inventoryMaterials.filter((m) => {
      if (!m.expiryDate) return false
      const expiryMs = new Date(m.expiryDate).getTime()
      return expiryMs - now < thirtyDays && expiryMs > now
    }).length
  }, [inventoryMaterials])

  if (!open) return null

  const handleAdd = () => {
    if (!form.name.trim()) return
    addInventoryMaterial(form)
    setForm(EMPTY_MATERIAL)
    setShowAddForm(false)
  }

  const handleEdit = (material: InventoryMaterial) => {
    setEditingId(material.id)
    setForm({
      name: material.name,
      category: material.category,
      spec: material.spec,
      unit: material.unit,
      purchasePrice: material.purchasePrice,
      currentStock: material.currentStock,
      minWarning: material.minWarning,
      supplier: material.supplier,
      batchNo: material.batchNo,
      expiryDate: material.expiryDate,
      notes: material.notes,
    })
    setShowAddForm(true)
  }

  const handleSaveEdit = () => {
    if (!editingId || !form.name.trim()) return
    updateInventoryMaterial(editingId, form)
    setEditingId(null)
    setForm(EMPTY_MATERIAL)
    setShowAddForm(false)
  }

  const handleCancelForm = () => {
    setEditingId(null)
    setForm(EMPTY_MATERIAL)
    setShowAddForm(false)
  }

  const allWarnings: CostWarning[] = costEstimate?.warnings || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-xl flex flex-col"
        style={{
          background: '#3D2B1F',
          border: '1px solid rgba(201,169,110,0.3)',
          width: '90vw',
          maxWidth: 900,
          maxHeight: '85vh',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
          <div className="flex items-center gap-3">
            <Package size={18} style={{ color: '#C9A96E' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>材料库存与成本管理</h3>
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                <AlertTriangle size={11} />
                {lowStockCount} 库存预警
              </span>
            )}
            {nearExpiryCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                {nearExpiryCount} 临期提醒
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCostPanel(!showCostPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: showCostPanel ? 'rgba(135,206,235,0.25)' : 'rgba(135,206,235,0.15)', color: '#87CEEB', border: '1px solid rgba(135,206,235,0.25)' }}
            >
              <TrendingUp size={13} />
              成本估算
            </button>
            <button
              onClick={onOpenQuotation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
            >
              <DollarSign size={13} />
              生成报价单
            </button>
            <button onClick={onClose} style={{ color: '#8B7355' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {allWarnings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 py-2" style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
            {allWarnings.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-xs rounded px-2 py-0.5"
                style={{ color: warningColor(w.level), background: `${warningColor(w.level)}15` }}
              >
                {warningIcon(w.type)}
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        )}

        {showCostPanel && costEstimate && (
          <div className="px-5 py-3" style={{ background: 'rgba(0,0,0,0.12)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
            <div className="grid grid-cols-5 gap-3 mb-2">
              <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs" style={{ color: '#8B7355' }}>材料成本</div>
                <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>¥{costEstimate.totalMaterialCost.toFixed(2)}</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs" style={{ color: '#8B7355' }}>损耗成本</div>
                <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{costEstimate.totalWasteCost.toFixed(2)}</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs flex items-center justify-center gap-0.5" style={{ color: '#8B7355' }}><Beaker size={10} /> 胶量成本</div>
                <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>¥{costEstimate.resinCost.toFixed(2)} / {costEstimate.totalResinMl.toFixed(1)}ml</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs" style={{ color: '#8B7355' }}>总成本(含人工)</div>
                <div className="text-sm font-bold" style={{ color: '#EF4444' }}>¥{costEstimate.totalCost.toFixed(2)}</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs" style={{ color: '#8B7355' }}>建议售价</div>
                <div className="text-sm font-bold" style={{ color: '#6B8E6B' }}>¥{costEstimate.suggestedPrice.toFixed(2)}</div>
              </div>
            </div>
            {costEstimate.consumptions.length > 0 && (
              <div className="space-y-1">
                {costEstimate.consumptions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.15)' }}>
                    <span style={{ color: '#C9A96E', minWidth: 70 }}>{c.materialName}</span>
                    <span style={{ color: '#8B7355' }}>消耗 {c.consumedQty}{c.unit}</span>
                    <span style={{ color: '#87CEEB' }}>¥{c.subtotal.toFixed(2)}</span>
                    <span style={{ color: '#F59E0B' }}>损耗 ¥{c.wasteCost.toFixed(2)}</span>
                    {c.remainingStock !== -1 && (
                      <span style={{ color: c.remainingStock < 0 ? '#EF4444' : '#6B8E6B' }}>
                        {c.remainingStock < 0 ? '缺口 ' : '剩余 '}{c.remainingStock < 0 ? Math.abs(c.remainingStock) : c.remainingStock}{c.unit}
                      </span>
                    )}
                    {c.remainingStock === -1 && (
                      <span style={{ color: '#8B7355' }}>未建档</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 px-5 py-2" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
          <div className="flex items-center gap-1.5 flex-1">
            <Search size={14} style={{ color: '#8B7355' }} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索材料名称、供应商、批次号..."
              className="flex-1 text-xs rounded px-2 py-1 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterCategory('all')}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: filterCategory === 'all' ? 'rgba(201,169,110,0.2)' : 'transparent',
                color: filterCategory === 'all' ? '#C9A96E' : '#8B7355',
                border: filterCategory === 'all' ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
              }}
            >
              全部
            </button>
            {INVENTORY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: filterCategory === cat.key ? 'rgba(201,169,110,0.2)' : 'transparent',
                  color: filterCategory === cat.key ? '#C9A96E' : '#8B7355',
                  border: filterCategory === cat.key ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setForm(EMPTY_MATERIAL); setShowAddForm(true); setEditingId(null) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <Plus size={13} />
            添加材料
          </button>
        </div>

        {showAddForm && (
          <div className="px-5 py-3" style={{ background: 'rgba(0,0,0,0.12)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>
                {editingId ? '编辑材料' : '添加新材料'}
              </span>
              <button onClick={handleCancelForm} style={{ color: '#8B7355' }}><X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  placeholder="材料名称"
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>规格</label>
                <input
                  value={form.spec}
                  onChange={(e) => setForm({ ...form, spec: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  placeholder="如 500ml/瓶"
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>单位</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  {['g', 'kg', 'ml', 'L', '片', '个', '包', '瓶', '套'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>采购单价 (¥)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>当前库存</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>最低预警量</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.minWarning}
                  onChange={(e) => setForm({ ...form, minWarning: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>供应商</label>
                <input
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  placeholder="供应商名称"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>批次号</label>
                <input
                  value={form.batchNo}
                  onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  placeholder="如 LOT-20240101"
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>保质期</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-0.5" style={{ color: '#8B7355' }}>备注</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  placeholder="备注信息"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelForm}
                className="px-3 py-1 rounded text-xs"
                style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355' }}
              >
                取消
              </button>
              <button
                onClick={editingId ? handleSaveEdit : handleAdd}
                className="px-3 py-1 rounded text-xs font-medium"
                style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
              >
                {editingId ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} style={{ color: '#5A4A3A', margin: '0 auto 8px' }} />
              <div className="text-xs" style={{ color: '#8B7355' }}>
                {inventoryMaterials.length === 0 ? '暂无库存材料，点击"添加材料"开始管理' : '没有匹配的材料'}
              </div>
            </div>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>名称</th>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>分类</th>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>规格/单位</th>
                  <th className="text-right py-2 px-1 font-medium" style={{ color: '#8B7355' }}>单价</th>
                  <th className="text-right py-2 px-1 font-medium" style={{ color: '#8B7355' }}>库存</th>
                  <th className="text-right py-2 px-1 font-medium" style={{ color: '#8B7355' }}>预警量</th>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>供应商</th>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>批次号</th>
                  <th className="text-left py-2 px-1 font-medium" style={{ color: '#8B7355' }}>保质期</th>
                  <th className="text-center py-2 px-1 font-medium" style={{ color: '#8B7355' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m) => {
                  const isLowStock = m.currentStock <= m.minWarning
                  const isNearExpiry = m.expiryDate && (() => {
                    const days = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return days <= 30 && days > 0
                  })()
                  const isExpired = m.expiryDate && new Date(m.expiryDate).getTime() < Date.now()
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <td className="py-2 px-1" style={{ color: '#FFF8F0' }}>
                        {m.name}
                        {isLowStock && <span className="ml-1" style={{ color: '#EF4444' }}>⚠</span>}
                        {isExpired && <span className="ml-1" style={{ color: '#EF4444' }}>⏰</span>}
                        {isNearExpiry && <span className="ml-1" style={{ color: '#F59E0B' }}>⏳</span>}
                      </td>
                      <td className="py-2 px-1" style={{ color: '#C9A96E' }}>
                        {INVENTORY_CATEGORIES.find((c) => c.key === m.category)?.icon} {CATEGORY_LABELS[m.category]}
                      </td>
                      <td className="py-2 px-1" style={{ color: '#8B7355' }}>{m.spec || '-'} / {m.unit}</td>
                      <td className="py-2 px-1 text-right" style={{ color: '#87CEEB' }}>¥{m.purchasePrice.toFixed(2)}</td>
                      <td className="py-2 px-1 text-right" style={{ color: isLowStock ? '#EF4444' : '#FFF8F0' }}>
                        {m.currentStock}{m.unit}
                      </td>
                      <td className="py-2 px-1 text-right" style={{ color: '#8B7355' }}>{m.minWarning}{m.unit}</td>
                      <td className="py-2 px-1" style={{ color: '#8B7355' }}>{m.supplier || '-'}</td>
                      <td className="py-2 px-1" style={{ color: '#8B7355' }}>{m.batchNo || '-'}</td>
                      <td className="py-2 px-1" style={{ color: isExpired ? '#EF4444' : isNearExpiry ? '#F59E0B' : '#8B7355' }}>
                        {m.expiryDate || '-'}
                      </td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(m)}
                            style={{ color: '#C9A96E' }}
                            title="编辑"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => deleteInventoryMaterial(m.id)}
                            style={{ color: '#8B7355' }}
                            title="删除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-2 text-xs" style={{ borderTop: '1px solid rgba(201,169,110,0.15)', color: '#8B7355' }}>
          共 {inventoryMaterials.length} 种材料 · 总库存价值 ¥{inventoryMaterials.reduce((s, m) => s + m.purchasePrice * m.currentStock, 0).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
