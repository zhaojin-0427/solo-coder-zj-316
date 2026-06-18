import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { OrderStatus, CustomerOrder, OrderAlertType } from '@/types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS,
  LOGISTICS_LABELS,
  getOrdersByStatus,
  advanceStage,
} from '@/utils/orderScheduler'
import { X, Plus, Trash2, Eye, Clock, AlertTriangle, Package, User, DollarSign, Check, ChevronRight, FileText, History, Calendar } from 'lucide-react'
import OrderForm from './OrderForm'
import OrderDetail from './OrderDetail'

interface Props {
  open: boolean
  onClose: () => void
}

const STATUSES: OrderStatus[] = [
  'pending_material',
  'pending_pour',
  'curing',
  'pending_demold',
  'pending_packaging',
  'delivered',
]

const MOLD_LABELS: Record<string, string> = {
  pendant: '吊坠',
  hairclip: '发夹',
  ring: '戒指托',
  coaster: '杯垫',
}

const ALERT_ICONS: Record<OrderAlertType, typeof AlertTriangle> = {
  delivery_urgent: Clock,
  insufficient_stock: Package,
  curing_overdue: AlertTriangle,
  quotation_unconfirmed: FileText,
  balance_unpaid: DollarSign,
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function hoursRemaining(ts: number): string {
  const diff = ts - Date.now()
  const hours = diff / (60 * 60 * 1000)
  if (hours < 0) return `已逾期 ${Math.abs(Math.round(hours))}h`
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}天`
}

function OrderCard({ order, onClick, onDelete }: { order: CustomerOrder; onClick: () => void; onDelete: () => void }) {
  const color = ORDER_STATUS_COLORS[order.status]
  const dangerAlert = order.alerts.find((a) => a.level === 'danger')

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-all"
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: dangerAlert ? `2px solid #EF4444` : '1px solid rgba(201,169,110,0.15)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!dangerAlert) {
          e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!dangerAlert) {
          e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)'
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono" style={{ color: '#8B7355' }}>{order.orderNo}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: '#8B7355' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="text-xs font-medium mb-1 truncate" style={{ color: '#FFF8F0' }}>
        {order.customerName || '未命名客户'}
      </div>

      <div className="text-[11px] mb-2 truncate" style={{ color: '#C9A96E' }}>
        {order.schemeName} · {MOLD_LABELS[order.moldType] || order.moldType}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
        <span className="text-[11px] font-bold" style={{ color: '#FFD700' }}>¥{order.totalAmount.toFixed(2)}</span>
      </div>

      {order.alerts.length > 0 && (
        <div className="space-y-1">
          {order.alerts.slice(0, 2).map((alert, i) => {
            const IconComp = ALERT_ICONS[alert.type] || AlertTriangle
            const alertColor = alert.level === 'danger' ? '#EF4444' : alert.level === 'warning' ? '#F59E0B' : '#87CEEB'
            return (
              <div
                key={i}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: `${alertColor}15`, color: alertColor }}
              >
                <IconComp size={10} />
                <span className="truncate">{alert.message}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: '#8B7355' }}>
        <span className="flex items-center gap-0.5">
          <Calendar size={10} />
          {formatDate(order.deliveryDate)}
        </span>
        <span style={{ color: order.deliveryDate < Date.now() ? '#EF4444' : '#8B7355' }}>
          {hoursRemaining(order.deliveryDate)}
        </span>
      </div>
    </div>
  )
}

export default function OrderKanban({ open, onClose }: Props) {
  const orders = useStore((s) => s.customerOrders)
  const deleteCustomerOrder = useStore((s) => s.deleteCustomerOrder)
  const advanceOrderStage = useStore((s) => s.advanceOrderStage)

  const [showOrderForm, setShowOrderForm] = useState(false)
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)
  const [filterKeyword, setFilterKeyword] = useState('')

  const filteredOrders = useMemo(() => {
    if (!filterKeyword.trim()) return orders
    const kw = filterKeyword.trim().toLowerCase()
    return orders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.customerName.toLowerCase().includes(kw) ||
        o.schemeName.toLowerCase().includes(kw) ||
        o.contactPhone.includes(kw)
    )
  }, [orders, filterKeyword])

  const ordersByStatus = useMemo(() => {
    const result: Record<OrderStatus, CustomerOrder[]> = {} as any
    STATUSES.forEach((s) => {
      result[s] = getOrdersByStatus(filteredOrders, s)
    })
    return result
  }, [filteredOrders])

  const viewingOrder = useMemo(() => {
    if (!viewingOrderId) return null
    return orders.find((o) => o.id === viewingOrderId) || null
  }, [orders, viewingOrderId])

  if (!open) return null

  const totalActive = orders.filter((o) => o.status !== 'delivered').length
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0)
  const urgentCount = orders.filter((o) => o.alerts.some((a) => a.level === 'danger')).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#2C1810' }}>
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: '#3D2B1F', borderBottom: '1px solid rgba(201,169,110,0.2)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: '#C9A96E' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>客户订单排期与交付看板</h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: '#8B7355' }}>
              进行中: <strong style={{ color: '#C9A96E' }}>{totalActive}</strong>
            </span>
            <span style={{ color: '#8B7355' }}>
              总营业额: <strong style={{ color: '#FFD700' }}>¥{totalRevenue.toFixed(2)}</strong>
            </span>
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                <AlertTriangle size={12} />
                {urgentCount} 个紧急
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="搜索订单号/客户/方案..."
            className="text-xs rounded px-2 py-1.5 outline-none w-52"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.2)' }}
          />
          <button
            onClick={() => setShowOrderForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <Plus size={13} />
            新建订单
          </button>
          <button onClick={onClose} style={{ color: '#8B7355' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 p-4 gap-3 overflow-x-auto">
        {STATUSES.map((status) => {
          const color = ORDER_STATUS_COLORS[status]
          const statusOrders = ordersByStatus[status]
          return (
            <div
              key={status}
              className="flex-shrink-0 flex flex-col rounded-lg"
              style={{ width: 240, background: 'rgba(0,0,0,0.15)', border: `1px solid ${color}30` }}
            >
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg"
                style={{ background: `${color}15`, borderBottom: `1px solid ${color}30` }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium" style={{ color }}>
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </div>
                <span className="text-[11px] px-1.5 rounded" style={{ background: `${color}25`, color }}>
                  {statusOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {statusOrders.length === 0 ? (
                  <div className="text-center py-6 text-[11px]" style={{ color: '#5A4A3A' }}>
                    暂无订单
                  </div>
                ) : (
                  statusOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => setViewingOrderId(order.id)}
                      onDelete={() => {
                        if (confirm('确定删除该订单？')) deleteCustomerOrder(order.id)
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <OrderForm
        open={showOrderForm}
        onClose={() => setShowOrderForm(false)}
      />

      {viewingOrder && (
        <OrderDetail
          open={!!viewingOrderId}
          onClose={() => setViewingOrderId(null)}
          order={viewingOrder}
        />
      )}
    </div>
  )
}
