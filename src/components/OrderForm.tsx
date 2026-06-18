import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { Scheme, Quotation, OrderSource, LogisticsMethod } from '@/types'
import { createOrderFromSchemeOrQuotation, ORDER_SOURCE_LABELS, LOGISTICS_LABELS } from '@/utils/orderScheduler'
import { X, Package, Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  preselectedSchemeId?: string | null
  preselectedQuotationId?: string | null
}

export default function OrderForm({ open, onClose, preselectedSchemeId, preselectedQuotationId }: Props) {
  const schemes = useStore((s) => s.schemes)
  const quotations = useStore((s) => s.quotations)
  const inventoryMaterials = useStore((s) => s.inventoryMaterials)
  const addCustomerOrder = useStore((s) => s.addCustomerOrder)

  const [customerName, setCustomerName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [source, setSource] = useState<OrderSource>('other')
  const [customRequirements, setCustomRequirements] = useState('')
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [deliveryDateStr, setDeliveryDateStr] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 16)
  })
  const [logisticsMethod, setLogisticsMethod] = useState<LogisticsMethod>('express')
  const [remarks, setRemarks] = useState('')
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(preselectedSchemeId || '')
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(preselectedQuotationId || '')

  const selectedScheme: Scheme | null = useMemo(() => {
    return schemes.find((s) => s.id === selectedSchemeId) || null
  }, [schemes, selectedSchemeId])

  const selectedQuotation: Quotation | null = useMemo(() => {
    return quotations.find((q) => q.id === selectedQuotationId) || null
  }, [quotations, selectedQuotationId])

  if (!open) return null

  const handleQuotationSelect = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    const q = quotations.find((x) => x.id === quotationId)
    if (q) {
      setSelectedSchemeId(q.schemeId || '')
      setCustomerName(q.customerName)
      if (q.finalPrice > 0) {
        setDepositAmount(String(Math.round(q.finalPrice * 0.3 * 100) / 100))
      }
    }
  }

  const handleSchemeSelect = (schemeId: string) => {
    setSelectedSchemeId(schemeId)
    const relatedQuotation = quotations.find((q) => q.schemeId === schemeId)
    if (relatedQuotation) {
      setSelectedQuotationId(relatedQuotation.id)
    }
  }

  const handleSubmit = () => {
    if (!customerName.trim()) {
      alert('请输入客户名称')
      return
    }
    if (!selectedSchemeId && !selectedQuotationId) {
      alert('请选择关联的方案或报价单')
      return
    }

    const deliveryDate = new Date(deliveryDateStr).getTime()
    if (isNaN(deliveryDate)) {
      alert('请选择有效的交付日期')
      return
    }

    const order = createOrderFromSchemeOrQuotation(
      selectedScheme,
      selectedQuotation,
      inventoryMaterials,
      {
        customerName: customerName.trim(),
        contactPhone: contactPhone.trim(),
        contactInfo: contactInfo.trim(),
        source,
        customRequirements: customRequirements.trim(),
        depositAmount: parseFloat(depositAmount) || 0,
        deliveryDate,
        logisticsMethod,
        remarks: remarks.trim(),
        schemeId: selectedSchemeId || null,
        quotationId: selectedQuotationId || null,
      }
    )

    addCustomerOrder(order)
    onClose()
  }

  const estimatedTotal = selectedQuotation?.finalPrice || 0
  const depositNum = parseFloat(depositAmount) || 0
  const balanceNum = Math.max(0, Math.round((estimatedTotal - depositNum) * 100) / 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-xl flex flex-col"
        style={{
          background: '#3D2B1F',
          border: '1px solid rgba(201,169,110,0.3)',
          width: '90vw',
          maxWidth: 680,
          maxHeight: '85vh',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}>
          <div className="flex items-center gap-3">
            <Package size={18} style={{ color: '#C9A96E' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>创建客户订单</h3>
          </div>
          <button onClick={onClose} style={{ color: '#8B7355' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>关联方案 / 报价单</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>选择方案</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => handleSchemeSelect(e.target.value)}
                  className="w-full text-xs rounded px-2 py-1.5 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <option value="">-- 选择方案 --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#8B7355' }}>选择报价单</label>
                <select
                  value={selectedQuotationId}
                  onChange={(e) => handleQuotationSelect(e.target.value)}
                  className="w-full text-xs rounded px-2 py-1.5 outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <option value="">-- 选择报价单（可选）--</option>
                  {quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.schemeName} {q.customerName ? `(${q.customerName})` : ''} - ¥{q.finalPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>客户名称 *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="客户名称"
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>联系电话</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="手机号"
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>其他联系方式</label>
            <input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="微信/邮箱/地址等"
              className="w-full text-xs rounded px-2 py-1.5 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>订单来源</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as OrderSource)}
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              >
                {Object.entries(ORDER_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>物流方式</label>
              <select
                value={logisticsMethod}
                onChange={(e) => setLogisticsMethod(e.target.value as LogisticsMethod)}
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              >
                {Object.entries(LOGISTICS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>定制要求</label>
            <textarea
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              placeholder="客户的特殊定制要求..."
              rows={2}
              className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>交付日期 *</label>
              <input
                type="datetime-local"
                value={deliveryDateStr}
                onChange={(e) => setDeliveryDateStr(e.target.value)}
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>定金金额 (¥)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="默认按总价30%"
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
              />
            </div>
          </div>

          {estimatedTotal > 0 && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
              <div className="text-xs mb-2" style={{ color: '#C9A96E' }}>费用概览</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs" style={{ color: '#8B7355' }}>总报价</div>
                  <div className="text-sm font-bold" style={{ color: '#FFF8F0' }}>¥{estimatedTotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#8B7355' }}>定金</div>
                  <div className="text-sm font-bold" style={{ color: '#6B8E6B' }}>¥{depositNum.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#8B7355' }}>尾款</div>
                  <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>¥{balanceNum.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs block mb-1" style={{ color: '#C9A96E' }}>备注</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="其他备注信息..."
              rows={2}
              className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(201,169,110,0.15)' }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <Check size={13} />
            创建订单
          </button>
        </div>
      </div>
    </div>
  )
}
