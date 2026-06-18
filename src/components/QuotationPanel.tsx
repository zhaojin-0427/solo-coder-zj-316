import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { Quotation, QuotationStatus, MoldType } from '@/types'
import {
  CATEGORY_LABELS,
  generateQuotation,
  getQuotationStatusLabel,
  getQuotationStatusColor,
  DEFAULT_PROFIT_MARGIN,
} from '@/utils/costCalculator'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import {
  X,
  Plus,
  Trash2,
  FileText,
  Search,
  Filter,
  DollarSign,
  Printer,
} from 'lucide-react'

const MOLD_LABELS: Record<MoldType, string> = {
  pendant: '吊坠',
  hairclip: '发夹',
  ring: '戒指托',
  coaster: '杯垫',
}

interface Props {
  open: boolean
  onClose: () => void
  onOpenInventory: () => void
}

export default function QuotationPanel({ open, onClose, onOpenInventory }: Props) {
  const inventoryMaterials = useStore((s) => s.inventoryMaterials)
  const quotations = useStore((s) => s.quotations)
  const addQuotation = useStore((s) => s.addQuotation)
  const updateQuotation = useStore((s) => s.updateQuotation)
  const deleteQuotation = useStore((s) => s.deleteQuotation)
  const layers = useStore((s) => s.layers)
  const stages = useStore((s) => s.stages)
  const currentMoldType = useStore((s) => s.currentMoldType)
  const schemes = useStore((s) => s.schemes)
  const currentSchemeId = useStore((s) => s.currentSchemeId)

  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [viewingId, setViewingId] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [laborHours, setLaborHours] = useState<number>(2)
  const [profitMargin, setProfitMargin] = useState<number>(DEFAULT_PROFIT_MARGIN)
  const [customerNotes, setCustomerNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  const [filterScheme, setFilterScheme] = useState<string>('all')
  const [filterMoldType, setFilterMoldType] = useState<MoldType | 'all'>('all')
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterStatus, setFilterStatus] = useState<QuotationStatus | 'all'>('all')

  const moldShape = MOLD_SHAPE_MAP[currentMoldType]

  const previewQuotation = useMemo(() => {
    if (layers.length === 0 && stages.length === 0) return null
    const schemeId = currentSchemeId || ''
    const schemeName = schemes.find((s) => s.id === currentSchemeId)?.name || '当前方案'
    return generateQuotation(
      schemeId,
      schemeName,
      currentMoldType,
      layers,
      stages,
      moldShape.areaMm2,
      inventoryMaterials,
      {
        customerName,
        laborHours,
        profitMargin,
        customerNotes,
        internalNotes,
      }
    )
  }, [layers, stages, moldShape.areaMm2, inventoryMaterials, currentSchemeId, schemes, currentMoldType, customerName, laborHours, profitMargin, customerNotes, internalNotes])

  const filteredQuotations = useMemo(() => {
    let list = [...quotations].sort((a, b) => b.createdAt - a.createdAt)
    if (filterScheme !== 'all') {
      list = list.filter((q) => q.schemeId === filterScheme)
    }
    if (filterMoldType !== 'all') {
      list = list.filter((q) => q.moldType === filterMoldType)
    }
    if (filterCustomer.trim()) {
      const kw = filterCustomer.trim().toLowerCase()
      list = list.filter((q) => q.customerName.toLowerCase().includes(kw))
    }
    if (filterStatus !== 'all') {
      list = list.filter((q) => q.status === filterStatus)
    }
    return list
  }, [quotations, filterScheme, filterMoldType, filterCustomer, filterStatus])

  const viewingQuotation = useMemo(() => {
    if (!viewingId) return null
    return quotations.find((q) => q.id === viewingId) || null
  }, [quotations, viewingId])

  if (!open) return null

  const handleGenerate = () => {
    if (!previewQuotation) return
    addQuotation(previewQuotation)
    setActiveTab('history')
  }

  const handlePrint = (quotation: Quotation) => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>制作报价单 - ${quotation.schemeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
    body { font-family: 'Noto Sans SC', -apple-system, sans-serif; padding: 40px; color: #4A3728; background: #fff; }
    .header { text-align: center; padding: 24px; background: linear-gradient(135deg, #FFFAF0, #FFF5E6); border: 2px solid #D4A574; border-radius: 12px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px 0; font-size: 26px; color: #8B5A2B; }
    .header .sub { font-size: 13px; color: #8B7355; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #FFFAF0; padding: 8px 12px; text-align: left; font-size: 12px; color: #8B5A2B; border: 1px solid #D4A574; }
    td { padding: 8px 12px; font-size: 12px; border: 1px solid #D4A574; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
    .summary-item { background: #FFFAF0; border: 1px solid rgba(212,165,116,0.3); border-radius: 8px; padding: 12px; text-align: center; }
    .summary-item .val { font-size: 18px; font-weight: 700; color: #C9A96E; }
    .summary-item .lbl { font-size: 11px; color: #8B7355; margin-top: 4px; }
    .final-price { background: linear-gradient(135deg, #8B5A2B, #C9A96E); color: #fff; text-align: center; padding: 16px; border-radius: 10px; margin: 20px 0; }
    .final-price .val { font-size: 32px; font-weight: 700; }
    .notes { background: rgba(201,169,110,0.08); border-radius: 8px; padding: 12px; font-size: 12px; color: #6B5B4E; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>✧ 制作报价单 ✧</h1>
    <div class="sub">方案: ${quotation.schemeName} · 模具: ${MOLD_LABELS[quotation.moldType]}${quotation.customerName ? ' · 客户: ' + quotation.customerName : ''} · 日期: ${new Date(quotation.createdAt).toLocaleDateString('zh-CN')}</div>
  </div>
  <h3 style="color:#8B5A2B; font-size:14px; margin-bottom:8px;">材料明细</h3>
  <table>
    <thead><tr><th>材料名称</th><th>分类</th><th>规格</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
    <tbody>
      ${quotation.items.map((item) => `<tr><td>${item.materialName}</td><td>${CATEGORY_LABELS[item.category]}</td><td>${item.spec || '-'}</td><td>${item.quantity}${item.unit}</td><td>¥${item.unitPrice.toFixed(2)}</td><td>¥${item.subtotal.toFixed(2)}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="summary">
    <div class="summary-item"><div class="val">¥${quotation.materialCost.toFixed(2)}</div><div class="lbl">材料成本</div></div>
    <div class="summary-item"><div class="val">${quotation.totalResinMl.toFixed(1)}ml / ¥${quotation.resinCost.toFixed(2)}</div><div class="lbl">胶量消耗</div></div>
    <div class="summary-item"><div class="val">¥${quotation.wasteCost.toFixed(2)}</div><div class="lbl">损耗成本</div></div>
    <div class="summary-item"><div class="val">${quotation.laborHours.toFixed(1)}h / ¥${quotation.laborCost.toFixed(2)}</div><div class="lbl">人工工时</div></div>
    <div class="summary-item"><div class="val">¥${quotation.riskMarkup.toFixed(2)}</div><div class="lbl">风险加价</div></div>
    <div class="summary-item"><div class="val">${(quotation.profitMargin * 100).toFixed(0)}%</div><div class="lbl">利润率</div></div>
  </div>
  <div class="final-price">
    <div style="font-size:14px; margin-bottom:4px;">最终报价</div>
    <div class="val">¥${quotation.finalPrice.toFixed(2)}</div>
  </div>
  ${quotation.customerNotes ? `<div class="notes"><strong>客户备注:</strong> ${quotation.customerNotes}</div>` : ''}
  <div style="margin-top:16px; font-size:11px; color:#8B7355; text-align:center;">报价单编号: ${quotation.id} · 生成时间: ${new Date(quotation.createdAt).toLocaleString('zh-CN')}</div>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 300)
    }
  }

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
            <FileText size={18} style={{ color: '#C9A96E' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>制作报价单管理</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInventory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(107,142,107,0.15)', color: '#6B8E6B', border: '1px solid rgba(107,142,107,0.25)' }}
            >
              库存管理
            </button>
            <button onClick={onClose} style={{ color: '#8B7355' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-5 py-2" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
          <button
            onClick={() => { setActiveTab('generate'); setViewingId(null) }}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{
              background: activeTab === 'generate' ? 'rgba(201,169,110,0.2)' : 'transparent',
              color: activeTab === 'generate' ? '#C9A96E' : '#8B7355',
              border: activeTab === 'generate' ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
            }}
          >
            <Plus size={12} className="inline mr-1" />
            生成报价
          </button>
          <button
            onClick={() => { setActiveTab('history'); setViewingId(null) }}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{
              background: activeTab === 'history' ? 'rgba(201,169,110,0.2)' : 'transparent',
              color: activeTab === 'history' ? '#C9A96E' : '#8B7355',
              border: activeTab === 'history' ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
            }}
          >
            <Filter size={12} className="inline mr-1" />
            历史报价 ({quotations.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'generate' && !viewingId && (
            <div className="p-5">
              {layers.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} style={{ color: '#5A4A3A', margin: '0 auto 8px' }} />
                  <div className="text-xs" style={{ color: '#8B7355' }}>请先创建方案并添加图层，才能生成报价单</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>客户名称</label>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="客户名称（可选）"
                        className="w-full text-xs rounded px-2 py-1.5 outline-none"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>人工工时 (小时)</label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={laborHours}
                        onChange={(e) => setLaborHours(parseFloat(e.target.value) || 1)}
                        className="w-full text-xs rounded px-2 py-1.5 outline-none"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>利润率 ({(profitMargin * 100).toFixed(0)}%)</label>
                      <input
                        type="range"
                        min={0.1}
                        max={0.8}
                        step={0.05}
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#C9A96E' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>客户备注</label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="客户可见的备注信息..."
                        rows={2}
                        className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>内部备注</label>
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="内部备注信息（客户不可见）..."
                        rows={2}
                        className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none"
                        style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                      />
                    </div>
                  </div>

                  {previewQuotation && (
                    <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.15)' }}>
                      <h4 className="text-sm font-semibold mb-3" style={{ color: '#C9A96E' }}>报价预览</h4>

                      <table className="w-full text-xs mb-3" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
                            <th className="text-left py-1.5 px-2" style={{ color: '#8B7355' }}>材料</th>
                            <th className="text-left py-1.5 px-2" style={{ color: '#8B7355' }}>分类</th>
                            <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>数量</th>
                            <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>单价</th>
                            <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewQuotation.items.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(201,169,110,0.06)' }}>
                              <td className="py-1.5 px-2" style={{ color: '#FFF8F0' }}>{item.materialName}</td>
                              <td className="py-1.5 px-2" style={{ color: '#C9A96E' }}>{CATEGORY_LABELS[item.category]}</td>
                              <td className="py-1.5 px-2 text-right" style={{ color: '#8B7355' }}>{item.quantity}{item.unit}</td>
                              <td className="py-1.5 px-2 text-right" style={{ color: '#87CEEB' }}>¥{item.unitPrice.toFixed(2)}</td>
                              <td className="py-1.5 px-2 text-right" style={{ color: '#FFF8F0' }}>¥{item.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>材料成本</div>
                          <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>¥{previewQuotation.materialCost.toFixed(2)}</div>
                        </div>
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>胶量消耗</div>
                          <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>{previewQuotation.totalResinMl.toFixed(1)}ml / ¥{previewQuotation.resinCost.toFixed(2)}</div>
                        </div>
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>损耗成本</div>
                          <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{previewQuotation.wasteCost.toFixed(2)}</div>
                        </div>
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>人工工时</div>
                          <div className="text-sm font-bold" style={{ color: '#C9A96E' }}>{previewQuotation.laborHours.toFixed(1)}h / ¥{previewQuotation.laborCost.toFixed(2)}</div>
                        </div>
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>风险加价</div>
                          <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{previewQuotation.riskMarkup.toFixed(2)}</div>
                        </div>
                        <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <div className="text-xs" style={{ color: '#8B7355' }}>利润率</div>
                          <div className="text-sm font-bold" style={{ color: '#6B8E6B' }}>{(previewQuotation.profitMargin * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <div className="rounded-lg p-3 text-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(139,90,43,0.3), rgba(201,169,110,0.3))' }}>
                        <div className="text-xs" style={{ color: '#8B7355' }}>最终报价</div>
                        <div className="text-2xl font-bold" style={{ color: '#C9A96E' }}>¥{previewQuotation.finalPrice.toFixed(2)}</div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePrint(previewQuotation)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355', border: '1px solid rgba(201,169,110,0.2)' }}
                        >
                          <Printer size={13} />
                          预览打印
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
                        >
                          <DollarSign size={13} />
                          保存报价单
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && !viewingId && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Search size={12} style={{ color: '#8B7355' }} />
                  <input
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    placeholder="客户名称"
                    className="text-xs rounded px-2 py-1 outline-none"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)', width: 120 }}
                  />
                </div>
                <select
                  value={filterScheme}
                  onChange={(e) => setFilterScheme(e.target.value)}
                  className="text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <option value="all">全部方案</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={filterMoldType}
                  onChange={(e) => setFilterMoldType(e.target.value as MoldType | 'all')}
                  className="text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <option value="all">全部模具</option>
                  {Object.entries(MOLD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as QuotationStatus | 'all')}
                  className="text-xs rounded px-2 py-1 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="sent">已发送</option>
                  <option value="accepted">已接受</option>
                  <option value="rejected">已拒绝</option>
                  <option value="expired">已过期</option>
                </select>
              </div>

              {filteredQuotations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} style={{ color: '#5A4A3A', margin: '0 auto 8px' }} />
                  <div className="text-xs" style={{ color: '#8B7355' }}>
                    {quotations.length === 0 ? '暂无报价记录，在"生成报价"页创建' : '没有匹配的报价记录'}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuotations.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}
                      onClick={() => setViewingId(q.id)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,169,110,0.3)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,169,110,0.1)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium truncate" style={{ color: '#FFF8F0' }}>{q.schemeName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getQuotationStatusColor(q.status)}20`, color: getQuotationStatusColor(q.status) }}>
                            {getQuotationStatusLabel(q.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: '#8B7355' }}>
                          <span>{MOLD_LABELS[q.moldType]}</span>
                          {q.customerName && <span>客户: {q.customerName}</span>}
                          <span>{new Date(q.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: '#C9A96E' }}>¥{q.finalPrice.toFixed(2)}</div>
                        <div className="text-xs" style={{ color: '#8B7355' }}>{q.items.length} 项材料</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrint(q) }}
                          style={{ color: '#8B7355' }}
                          title="打印"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteQuotation(q.id) }}
                          style={{ color: '#8B7355' }}
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewingId && viewingQuotation && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingId(null)}
                    className="text-xs"
                    style={{ color: '#8B7355' }}
                  >
                    ← 返回列表
                  </button>
                  <span className="text-xs" style={{ color: '#8B7355' }}>|</span>
                  <span className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>{viewingQuotation.schemeName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getQuotationStatusColor(viewingQuotation.status)}20`, color: getQuotationStatusColor(viewingQuotation.status) }}>
                    {getQuotationStatusLabel(viewingQuotation.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={viewingQuotation.status}
                    onChange={(e) => updateQuotation(viewingId, { status: e.target.value as QuotationStatus })}
                    className="text-xs rounded px-2 py-1 outline-none"
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                  >
                    <option value="draft">草稿</option>
                    <option value="sent">已发送</option>
                    <option value="accepted">已接受</option>
                    <option value="rejected">已拒绝</option>
                    <option value="expired">已过期</option>
                  </select>
                  <button
                    onClick={() => handlePrint(viewingQuotation)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355' }}
                  >
                    <Printer size={12} /> 打印
                  </button>
                </div>
              </div>

              <table className="w-full text-xs mb-3" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
                    <th className="text-left py-1.5 px-2" style={{ color: '#8B7355' }}>材料</th>
                    <th className="text-left py-1.5 px-2" style={{ color: '#8B7355' }}>分类</th>
                    <th className="text-left py-1.5 px-2" style={{ color: '#8B7355' }}>规格</th>
                    <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>数量</th>
                    <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>单价</th>
                    <th className="text-right py-1.5 px-2" style={{ color: '#8B7355' }}>小计</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingQuotation.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(201,169,110,0.06)' }}>
                      <td className="py-1.5 px-2" style={{ color: '#FFF8F0' }}>{item.materialName}</td>
                      <td className="py-1.5 px-2" style={{ color: '#C9A96E' }}>{CATEGORY_LABELS[item.category]}</td>
                      <td className="py-1.5 px-2" style={{ color: '#8B7355' }}>{item.spec || '-'}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: '#8B7355' }}>{item.quantity}{item.unit}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: '#87CEEB' }}>¥{item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right" style={{ color: '#FFF8F0' }}>¥{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>材料成本</div>
                  <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>¥{viewingQuotation.materialCost.toFixed(2)}</div>
                </div>
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>胶量消耗</div>
                  <div className="text-sm font-bold" style={{ color: '#87CEEB' }}>{viewingQuotation.totalResinMl.toFixed(1)}ml / ¥{viewingQuotation.resinCost.toFixed(2)}</div>
                </div>
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>损耗成本</div>
                  <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{viewingQuotation.wasteCost.toFixed(2)}</div>
                </div>
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>人工工时</div>
                  <div className="text-sm font-bold" style={{ color: '#C9A96E' }}>{viewingQuotation.laborHours.toFixed(1)}h / ¥{viewingQuotation.laborCost.toFixed(2)}</div>
                </div>
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>风险加价</div>
                  <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{viewingQuotation.riskMarkup.toFixed(2)}</div>
                </div>
                <div className="rounded p-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-xs" style={{ color: '#8B7355' }}>利润率</div>
                  <div className="text-sm font-bold" style={{ color: '#6B8E6B' }}>{(viewingQuotation.profitMargin * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="rounded-lg p-3 text-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(139,90,43,0.3), rgba(201,169,110,0.3))' }}>
                <div className="text-xs" style={{ color: '#8B7355' }}>最终报价</div>
                <div className="text-2xl font-bold" style={{ color: '#C9A96E' }}>¥{viewingQuotation.finalPrice.toFixed(2)}</div>
              </div>

              {viewingQuotation.customerNotes && (
                <div className="rounded p-2 mb-2 text-xs" style={{ background: 'rgba(0,0,0,0.15)', color: '#FFF8F0' }}>
                  <span style={{ color: '#C9A96E' }}>客户备注: </span>{viewingQuotation.customerNotes}
                </div>
              )}
              {viewingQuotation.internalNotes && (
                <div className="rounded p-2 text-xs" style={{ background: 'rgba(0,0,0,0.15)', color: '#8B7355' }}>
                  <span style={{ color: '#C9A96E' }}>内部备注: </span>{viewingQuotation.internalNotes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
