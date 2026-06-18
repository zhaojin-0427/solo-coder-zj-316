import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { CustomerOrder, OrderStatus, ReviewRecord } from '@/types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS,
  LOGISTICS_LABELS,
} from '@/utils/orderScheduler'
import { CATEGORY_LABELS } from '@/utils/costCalculator'
import {
  X, User, Phone, MapPin, DollarSign, Calendar, Truck, AlertTriangle,
  Clock, Package, ChevronRight, Check, FileText, History, Layers,
  Eye, Edit3, ArrowRight, AlertCircle, CheckCircle2
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  order: CustomerOrder
}

const MOLD_LABELS: Record<string, string> = {
  pendant: '吊坠',
  hairclip: '发夹',
  ring: '戒指托',
  coaster: '杯垫',
}

const STATUS_FLOW: OrderStatus[] = [
  'pending_material',
  'pending_pour',
  'curing',
  'pending_demold',
  'pending_packaging',
  'delivered',
]

function formatDateTime(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatHours(h: number): string {
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}天`
}

export default function OrderDetail({ open, onClose, order }: Props) {
  const schemes = useStore((s) => s.schemes)
  const quotations = useStore((s) => s.quotations)
  const reviewRecords = useStore((s) => s.reviewRecords)
  const updateCustomerOrder = useStore((s) => s.updateCustomerOrder)
  const setCustomerOrderStatus = useStore((s) => s.setCustomerOrderStatus)
  const advanceOrderStage = useStore((s) => s.advanceOrderStage)

  const [editingTracking, setEditingTracking] = useState(false)
  const [trackingNo, setTrackingNo] = useState(order.trackingNo)
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'stages' | 'related'>('info')

  const relatedScheme = useMemo(() => {
    return order.schemeId ? schemes.find((s) => s.id === order.schemeId) || null : null
  }, [schemes, order.schemeId])

  const relatedQuotation = useMemo(() => {
    return order.quotationId ? quotations.find((q) => q.id === order.quotationId) || null : null
  }, [quotations, order.quotationId])

  const relatedReviews: ReviewRecord[] = useMemo(() => {
    if (order.schemeId) {
      return reviewRecords.filter((r) => r.schemeId === order.schemeId)
    }
    if (order.reviewIds && order.reviewIds.length > 0) {
      return reviewRecords.filter((r) => order.reviewIds.includes(r.id))
    }
    return []
  }, [reviewRecords, order.schemeId, order.reviewIds])

  if (!open) return null

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status)
  const hasNextStatus = currentStatusIndex < STATUS_FLOW.length - 1

  const handleAdvance = () => {
    if (order.status === 'pending_packaging') {
      setCustomerOrderStatus(order.id, 'delivered')
    } else {
      advanceOrderStage(order.id)
    }
  }

  const handleSaveTracking = () => {
    updateCustomerOrder(order.id, { trackingNo: trackingNo.trim() })
    setEditingTracking(false)
  }

  const handleTogglePaid = (field: 'depositPaid' | 'balancePaid') => {
    updateCustomerOrder(order.id, { [field]: !order[field] })
  }

  const handleToggleQuotationConfirmed = () => {
    updateCustomerOrder(order.id, { quotationConfirmed: !order.quotationConfirmed })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="rounded-xl flex flex-col"
        style={{
          background: '#3D2B1F',
          border: '1px solid rgba(201,169,110,0.3)',
          width: '92vw',
          maxWidth: 880,
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(201,169,110,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <Package size={18} style={{ color: '#C9A96E' }} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>{order.orderNo}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded"
                  style={{
                    background: `${ORDER_STATUS_COLORS[order.status]}20`,
                    color: ORDER_STATUS_COLORS[order.status],
                    border: `1px solid ${ORDER_STATUS_COLORS[order.status]}40`,
                  }}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: '#8B7355' }}>
                创建于 {formatDateTime(order.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasNextStatus && order.status !== 'delivered' && (
              <button
                onClick={handleAdvance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(107,142,107,0.2)',
                  color: '#6B8E6B',
                  border: '1px solid rgba(107,142,107,0.3)',
                }}
              >
                <ArrowRight size={13} />
                推进到{ORDER_STATUS_LABELS[STATUS_FLOW[currentStatusIndex + 1]]}
              </button>
            )}
            <button onClick={onClose} style={{ color: '#8B7355' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {order.alerts.length > 0 && (
          <div className="px-5 py-2 space-y-1" style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
            {order.alerts.map((alert, i) => {
              const color = alert.level === 'danger' ? '#EF4444' : alert.level === 'warning' ? '#F59E0B' : '#87CEEB'
              return (
                <div key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color }}>
                  <AlertTriangle size={12} />
                  {alert.message}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-1 px-5 py-2" style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          {([
            ['info', '基本信息', User],
            ['materials', '材料成本', Package],
            ['stages', '制作进度', Clock],
            ['related', '关联记录', FileText],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
              style={{
                background: activeTab === key ? 'rgba(201,169,110,0.2)' : 'transparent',
                color: activeTab === key ? '#C9A96E' : '#8B7355',
                border: activeTab === key ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                  <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                    <User size={12} /> 客户信息
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>客户名称</span>
                      <span style={{ color: '#FFF8F0' }}>{order.customerName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>联系电话</span>
                      <span style={{ color: '#FFF8F0' }}>{order.contactPhone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>其他联系方式</span>
                      <span style={{ color: '#FFF8F0' }}>{order.contactInfo || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>订单来源</span>
                      <span style={{ color: '#FFF8F0' }}>{ORDER_SOURCE_LABELS[order.source] || order.source}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                  <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                    <Calendar size={12} /> 交付与物流
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>交付日期</span>
                      <span style={{ color: order.deliveryDate < Date.now() ? '#EF4444' : '#FFF8F0' }}>
                        {formatDateTime(order.deliveryDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#8B7355' }}>物流方式</span>
                      <span style={{ color: '#FFF8F0' }}>{LOGISTICS_LABELS[order.logisticsMethod] || order.logisticsMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#8B7355' }}>物流单号</span>
                      {editingTracking ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="text-[11px] rounded px-1.5 py-0.5 w-32 outline-none"
                            style={{ background: 'rgba(0,0,0,0.4)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
                          />
                          <button onClick={handleSaveTracking} style={{ color: '#6B8E6B' }}>
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1" style={{ color: '#FFF8F0' }}>
                          {order.trackingNo || '-'}
                          <button onClick={() => setEditingTracking(true)} style={{ color: '#8B7355' }}>
                            <Edit3 size={10} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <div className="text-[11px] mb-3 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                  <DollarSign size={12} /> 费用与付款
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-[11px]" style={{ color: '#8B7355' }}>总金额</div>
                    <div className="text-sm font-bold" style={{ color: '#FFD700' }}>¥{order.totalAmount.toFixed(2)}</div>
                  </div>
                  <div
                    className="text-center rounded p-2 cursor-pointer transition-all"
                    onClick={handleTogglePaid.bind(null, 'depositPaid')}
                    style={{
                      background: order.depositPaid ? 'rgba(107,142,107,0.15)' : 'rgba(0,0,0,0.2)',
                      border: order.depositPaid ? '1px solid rgba(107,142,107,0.3)' : '1px solid transparent',
                    }}
                  >
                    <div className="text-[11px] flex items-center justify-center gap-1" style={{ color: '#8B7355' }}>
                      定金 {order.depositPaid && <CheckCircle2 size={10} style={{ color: '#6B8E6B' }} />}
                    </div>
                    <div className="text-sm font-bold" style={{ color: order.depositPaid ? '#6B8E6B' : '#FFF8F0' }}>
                      ¥{order.depositAmount.toFixed(2)}
                    </div>
                    <div className="text-[9px]" style={{ color: order.depositPaid ? '#6B8E6B' : '#8B7355' }}>
                      点击切换{order.depositPaid ? '已收' : '未收'}
                    </div>
                  </div>
                  <div
                    className="text-center rounded p-2 cursor-pointer transition-all"
                    onClick={handleTogglePaid.bind(null, 'balancePaid')}
                    style={{
                      background: order.balancePaid ? 'rgba(107,142,107,0.15)' : 'rgba(0,0,0,0.2)',
                      border: order.balancePaid ? '1px solid rgba(107,142,107,0.3)' : '1px solid transparent',
                    }}
                  >
                    <div className="text-[11px] flex items-center justify-center gap-1" style={{ color: '#8B7355' }}>
                      尾款 {order.balancePaid && <CheckCircle2 size={10} style={{ color: '#6B8E6B' }} />}
                    </div>
                    <div className="text-sm font-bold" style={{ color: order.balancePaid ? '#6B8E6B' : '#FFF8F0' }}>
                      ¥{order.balanceAmount.toFixed(2)}
                    </div>
                    <div className="text-[9px]" style={{ color: order.balancePaid ? '#6B8E6B' : '#8B7355' }}>
                      点击切换{order.balancePaid ? '已收' : '未收'}
                    </div>
                  </div>
                  <div
                    className="text-center rounded p-2 cursor-pointer transition-all"
                    onClick={handleToggleQuotationConfirmed}
                    style={{
                      background: order.quotationConfirmed ? 'rgba(107,142,107,0.15)' : 'rgba(0,0,0,0.2)',
                      border: order.quotationConfirmed ? '1px solid rgba(107,142,107,0.3)' : '1px solid transparent',
                    }}
                  >
                    <div className="text-[11px] flex items-center justify-center gap-1" style={{ color: '#8B7355' }}>
                      报价确认 {order.quotationConfirmed && <CheckCircle2 size={10} style={{ color: '#6B8E6B' }} />}
                    </div>
                    <div className="text-sm font-bold" style={{ color: order.quotationConfirmed ? '#6B8E6B' : '#F59E0B' }}>
                      {order.quotationConfirmed ? '已确认' : '未确认'}
                    </div>
                    <div className="text-[9px]" style={{ color: '#8B7355' }}>点击切换</div>
                  </div>
                </div>
              </div>

              {order.customRequirements && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                  <div className="text-[11px] mb-1" style={{ color: '#C9A96E' }}>定制要求</div>
                  <div className="text-xs whitespace-pre-wrap" style={{ color: '#FFF8F0' }}>{order.customRequirements}</div>
                </div>
              )}

              {order.remarks && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                  <div className="text-[11px] mb-1" style={{ color: '#C9A96E' }}>备注</div>
                  <div className="text-xs whitespace-pre-wrap" style={{ color: '#FFF8F0' }}>{order.remarks}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="p-5">
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(201,169,110,0.15)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.1)' }}>
                      <th className="text-left py-2 px-3" style={{ color: '#C9A96E' }}>材料名称</th>
                      <th className="text-left py-2 px-3" style={{ color: '#C9A96E' }}>分类</th>
                      <th className="text-right py-2 px-3" style={{ color: '#C9A96E' }}>需求数量</th>
                      <th className="text-right py-2 px-3" style={{ color: '#C9A96E' }}>现有库存</th>
                      <th className="text-right py-2 px-3" style={{ color: '#C9A96E' }}>缺料</th>
                      <th className="text-right py-2 px-3" style={{ color: '#C9A96E' }}>单价</th>
                      <th className="text-right py-2 px-3" style={{ color: '#C9A96E' }}>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.materials.map((m, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(201,169,110,0.05)' }}>
                        <td className="py-2 px-3" style={{ color: '#FFF8F0' }}>{m.materialName}</td>
                        <td className="py-2 px-3" style={{ color: '#C9A96E' }}>{CATEGORY_LABELS[m.category]}</td>
                        <td className="py-2 px-3 text-right" style={{ color: '#FFF8F0' }}>{m.requiredQty}{m.unit}</td>
                        <td className="py-2 px-3 text-right" style={{ color: m.inStock >= m.requiredQty ? '#6B8E6B' : '#FFF8F0' }}>
                          {m.inStock}{m.unit}
                        </td>
                        <td className="py-2 px-3 text-right" style={{ color: m.shortageQty > 0 ? '#EF4444' : '#6B8E6B' }}>
                          {m.shortageQty > 0 ? `${m.shortageQty}${m.unit}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right" style={{ color: '#87CEEB' }}>¥{m.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right" style={{ color: '#FFF8F0' }}>¥{m.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-[11px]" style={{ color: '#8B7355' }}>材料成本</div>
                  <div className="text-base font-bold" style={{ color: '#87CEEB' }}>
                    ¥{order.materials.reduce((s, m) => s + m.subtotal, 0).toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-[11px]" style={{ color: '#8B7355' }}>人工工时</div>
                  <div className="text-base font-bold" style={{ color: '#C9A96E' }}>{order.laborHours.toFixed(1)}h</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div className="text-[11px]" style={{ color: '#8B7355' }}>总固化时长</div>
                  <div className="text-base font-bold" style={{ color: '#3B82F6' }}>{formatHours(order.totalCuringHours)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="p-5">
              <div className="space-y-3">
                {order.productionStages.map((stage, i) => {
                  const isActive = stage.status === 'in_progress'
                  const isDone = stage.status === 'completed'
                  const stageColor = isDone ? '#6B8E6B' : isActive ? '#3B82F6' : '#8B7355'
                  return (
                    <div
                      key={stage.stageId}
                      className="rounded-lg p-3 flex items-center gap-3"
                      style={{
                        background: isActive ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'rgba(201,169,110,0.1)'}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${stageColor}20`, color: stageColor }}
                      >
                        {isDone ? <Check size={14} /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium" style={{ color: '#FFF8F0' }}>{stage.stageName}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: `${stageColor}20`, color: stageColor }}
                          >
                            {isDone ? '已完成' : isActive ? '进行中' : '待开始'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: '#8B7355' }}>
                          <span>
                            计划: {formatDateTime(stage.plannedStartAt)} ~ {formatDateTime(stage.plannedEndAt)}
                          </span>
                          <span>
                            实际: {stage.actualStartAt ? formatDateTime(stage.actualStartAt) : '-'}
                            {stage.actualEndAt ? ` ~ ${formatDateTime(stage.actualEndAt)}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold" style={{ color: stageColor }}>
                          {formatHours(stage.durationHours)}
                        </div>
                        <div className="text-[10px]" style={{ color: '#8B7355' }}>预计时长</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#8B7355' }}>总预计制作时长</span>
                  <span className="font-bold" style={{ color: '#C9A96E' }}>
                    {formatHours(order.productionStages.reduce((s, st) => s + st.durationHours, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span style={{ color: '#8B7355' }}>已完成阶段</span>
                  <span style={{ color: '#6B8E6B' }}>
                    {order.productionStages.filter((s) => s.status === 'completed').length} / {order.productionStages.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="p-5 space-y-4">
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                  <Layers size={12} /> 关联方案
                </div>
                {relatedScheme ? (
                  <div className="text-xs">
                    <div style={{ color: '#FFF8F0' }}>{relatedScheme.name}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#8B7355' }}>
                      模具: {MOLD_LABELS[relatedScheme.moldType]} · {relatedScheme.layers.length} 层 · {relatedScheme.stages.length} 阶段
                    </div>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: '#5A4A3A' }}>未关联方案</div>
                )}
              </div>

              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                  <FileText size={12} /> 关联报价单
                </div>
                {relatedQuotation ? (
                  <div className="text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#FFF8F0' }}>{relatedQuotation.schemeName}</span>
                      <span className="font-bold" style={{ color: '#FFD700' }}>¥{relatedQuotation.finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#8B7355' }}>
                      材料: ¥{relatedQuotation.materialCost.toFixed(2)} · 人工: {relatedQuotation.laborHours.toFixed(1)}h · 生成于 {formatDateTime(relatedQuotation.createdAt)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: '#5A4A3A' }}>未关联报价单</div>
                )}
              </div>

              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <div className="text-[11px] mb-2 flex items-center gap-1" style={{ color: '#C9A96E' }}>
                  <History size={12} /> 历史复盘记录 ({relatedReviews.length})
                </div>
                {relatedReviews.length === 0 ? (
                  <div className="text-xs" style={{ color: '#5A4A3A' }}>暂无复盘记录</div>
                ) : (
                  <div className="space-y-2">
                    {relatedReviews.map((r) => (
                      <div key={r.id} className="text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: '#FFF8F0' }}>{r.actualStatus || '完成复盘'}</span>
                          <span style={{ color: '#8B7355' }}>{formatDateTime(r.createdAt)}</span>
                        </div>
                        <div className="text-[10px]" style={{ color: '#C9A96E' }}>
                          成功率: {r.successRate} · 实际固化: {r.actualCuringHours.toFixed(1)}h · 温度: {r.ambientTemp}°C
                        </div>
                        {r.improvements && (
                          <div className="text-[10px] mt-1" style={{ color: '#6B8E6B' }}>
                            💡 {r.improvements}
                          </div>
                        )}
                        {r.defects.length > 0 && (
                          <div className="text-[10px] mt-1" style={{ color: '#F59E0B' }}>
                            ⚠ 缺陷: {r.defects.map((d) => d.type).join('、')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
