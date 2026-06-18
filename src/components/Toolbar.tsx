import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { MOLD_SHAPE_MAP } from '@/utils/moldShapes'
import { Save, FolderOpen, Download, Printer, Trash2, X, GitCompare, BookOpen, ClipboardList, Edit, Plus } from 'lucide-react'
import SchemeComparison from './SchemeComparison'
import ReviewEditor from './ReviewEditor'
import KnowledgeDrawer from './KnowledgeDrawer'

export default function Toolbar() {
  const schemes = useStore((s) => s.schemes)
  const currentSchemeId = useStore((s) => s.currentSchemeId)
  const saveScheme = useStore((s) => s.saveScheme)
  const loadScheme = useStore((s) => s.loadScheme)
  const deleteScheme = useStore((s) => s.deleteScheme)
  const layers = useStore((s) => s.layers)
  const stages = useStore((s) => s.stages)
  const currentMoldType = useStore((s) => s.currentMoldType)
  const ambientTemp = useStore((s) => s.ambientTemp)
  const clearCanvas = useStore((s) => s.clearCanvas)
  const reviewRecords = useStore((s) => s.reviewRecords)
  const knowledgeCards = useStore((s) => s.knowledgeCards)
  const addReviewRecord = useStore((s) => s.addReviewRecord)
  const updateReviewRecord = useStore((s) => s.updateReviewRecord)
  const generateKnowledgeCard = useStore((s) => s.generateKnowledgeCard)
  const showKnowledgeDrawer = useStore((s) => s.showKnowledgeDrawer)
  const setShowKnowledgeDrawer = useStore((s) => s.setShowKnowledgeDrawer)
  const viewingReviewId = useStore((s) => s.viewingReviewId)
  const setViewingReviewId = useStore((s) => s.setViewingReviewId)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [schemeName, setSchemeName] = useState('')
  const [showSchemeList, setShowSchemeList] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showReviewEditor, setShowReviewEditor] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [reviewSchemeId, setReviewSchemeId] = useState<string>('')

  const handleSave = () => {
    if (schemeName.trim()) {
      saveScheme(schemeName.trim())
      setSchemeName('')
      setShowSaveDialog(false)
    }
  }

  const handleOpenReview = (schemeId: string) => {
    setReviewSchemeId(schemeId)
    setEditingReviewId(null)
    setShowSchemeList(false)
    setShowReviewEditor(true)
  }

  const handleEditReview = (reviewId: string) => {
    setEditingReviewId(reviewId)
    const review = reviewRecords.find((r) => r.id === reviewId)
    if (review) {
      setReviewSchemeId(review.schemeId)
    }
    setShowReviewEditor(true)
  }

  const handleSaveReview = (record: any) => {
    if (editingReviewId) {
      updateReviewRecord(editingReviewId, record)
      generateKnowledgeCard(editingReviewId)
    } else {
      const newId = addReviewRecord(record)
      generateKnowledgeCard(newId)
    }
    setEditingReviewId(null)
    setShowReviewEditor(false)
  }

  const getReviewsBySchemeId = (schemeId: string) => {
    return reviewRecords.filter((r) => r.schemeId === schemeId)
  }

  useEffect(() => {
    if (viewingReviewId) {
      const review = reviewRecords.find((r) => r.id === viewingReviewId)
      if (review) {
        setReviewSchemeId(review.schemeId)
        setEditingReviewId(viewingReviewId)
        setShowReviewEditor(true)
      }
    }
  }, [viewingReviewId, reviewRecords])

  useEffect(() => {
    if (!showReviewEditor && viewingReviewId) {
      setViewingReviewId(null)
    }
  }, [showReviewEditor, viewingReviewId, setViewingReviewId])

  const handleExportImage = async () => {
    const canvasEl = document.querySelector('#mold-canvas') as HTMLCanvasElement
    if (!canvasEl) return
    try {
      const dataUrl = canvasEl.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `滴胶排版-${MOLD_SHAPE_MAP[currentMoldType].label}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch {
      // fallback
    }
    setShowExportMenu(false)
  }

  const handlePrintMaterialList = () => {
    const moldLabel = MOLD_SHAPE_MAP[currentMoldType].label
    const moldArea = MOLD_SHAPE_MAP[currentMoldType].areaMm2
    const allElements = layers.flatMap((l) => l.elements)
    const sortedLayers = [...layers].sort((a, b) => a.order - b.order)

    const CATEGORY_NAMES = { driedFlower: '干花', glitter: '亮片', goldFoil: '金箔', colorPowder: '色粉' }
    const CATEGORY_TIPS = {
      driedFlower: ['干花需提前脱水处理', '建议先刷薄层胶固定'],
      glitter: ['亮片易产生气泡，缓慢倒入', '可分层撒布增加层次感'],
      goldFoil: ['金箔极薄，用镊子轻取', '避免褶皱影响美观'],
      colorPowder: ['色粉需与少量胶预混合', '少量多次调色更均匀'],
    }

    const totalResinMl = sortedLayers.reduce((sum, l) => {
      return sum + Math.round(moldArea * l.thickness * 0.001 * 100) / 100
    }, 0)
    const totalHours = sortedLayers.reduce((sum, l) => {
      let h = l.thickness * 10
      if (l.type === 'colorPowder') h *= 1.1
      if (l.elements.length > 5) h *= 1.05
      return sum + h
    }, 0)

    const layersHtml = sortedLayers.map((l, i) => {
      const resinMl = Math.round(moldArea * l.thickness * 0.001 * 100) / 100
      let layerHours = l.thickness * 10
      if (l.type === 'colorPowder') layerHours *= 1.1
      if (l.elements.length > 5) layerHours *= 1.05
      const uniqueNames = [...new Set(l.elements.map(e => e.name))]
      const tips = CATEGORY_TIPS[l.type] || []

      return `
        <div style="page-break-inside: avoid; border: 1px solid #D4A574; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #FFFAF0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px dashed #D4A574;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #D4A574, #C9A96E); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 18px;">${i + 1}</div>
              <div>
                <div style="font-size: 16px; font-weight: 600; color: #4A3728;">${l.name}</div>
                <div style="font-size: 12px; color: #8B7355;">${CATEGORY_NAMES[l.type]}层</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <div style="color: #4A90B8;">胶量: <strong>${resinMl.toFixed(1)} ml</strong></div>
              <div style="color: #C9A96E;">固化: <strong>${layerHours.toFixed(1)} 小时</strong></div>
              <div style="color: #8B7355;">厚度: ${l.thickness}mm · 透明度: ${Math.round(l.opacity * 100)}%</div>
            </div>
          </div>
          ${uniqueNames.length > 0 ? `
            <div style="margin-bottom: 8px;">
              <span style="font-size: 12px; color: #8B7355;">材料清单 (${l.elements.length}个):</span>
              <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;">
                ${uniqueNames.map(n => `<span style="background: rgba(212,165,116,0.15); padding: 3px 10px; border-radius: 12px; font-size: 12px; color: #4A3728;">${n}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          <div style="background: rgba(201,169,110,0.08); padding: 8px 12px; border-radius: 6px;">
            <div style="font-size: 11px; color: #C9A96E; font-weight: 600; margin-bottom: 4px;">操作提示:</div>
            ${tips.map(t => `<div style="font-size: 11px; color: #6B5B4E; margin: 2px 0;">• ${t}</div>`).join('')}
          </div>
        </div>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>滴胶饰品制作材料清单</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
    body { font-family: 'Noto Sans SC', -apple-system, sans-serif; padding: 40px; color: #4A3728; background: #fff; }
    .header { text-align: center; padding: 24px; background: linear-gradient(135deg, #FFFAF0, #FFF5E6); border: 2px solid #D4A574; border-radius: 12px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; color: #8B5A2B; }
    .header .sub { font-size: 14px; color: #8B7355; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0 24px 0; }
    .stat { background: #FFFAF0; border: 1px solid rgba(212,165,116,0.3); border-radius: 8px; padding: 12px; text-align: center; }
    .stat .val { font-size: 22px; font-weight: 700; color: #C9A96E; }
    .stat .lbl { font-size: 11px; color: #8B7355; margin-top: 4px; }
    .footer { margin-top: 24px; padding: 16px; background: rgba(201,169,110,0.08); border-radius: 8px; font-size: 11px; color: #8B7355; line-height: 1.8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>✧ 滴胶饰品制作材料清单 ✧</h1>
    <div class="sub">模具类型: ${moldLabel} · 生成时间: ${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="val">${layers.length}</div><div class="lbl">总层数</div></div>
    <div class="stat"><div class="val">${layers.reduce((s, l) => s + l.thickness, 0).toFixed(1)}<span style="font-size:14px;">mm</span></div><div class="lbl">总厚度</div></div>
    <div class="stat"><div class="val">${allElements.length}</div><div class="lbl">材料总数</div></div>
    <div class="stat"><div class="val" style="color:#4A90B8;">${totalResinMl.toFixed(1)}<span style="font-size:14px;">ml</span></div><div class="lbl">预估胶量</div></div>
    <div class="stat"><div class="val" style="color:#E07B39;">${totalHours.toFixed(1)}<span style="font-size:14px;">h</span></div><div class="lbl">固化时间</div></div>
    <div class="stat"><div class="val">${MOLD_SHAPE_MAP[currentMoldType].areaMm2.toFixed(0)}<span style="font-size:14px;">mm²</span></div><div class="lbl">模具面积</div></div>
  </div>
  ${layersHtml}
  <div class="footer">
    <div><strong>制作流程建议:</strong></div>
    <div>1. 准备工作：清洁模具，准备好所有材料和工具，按配方称量滴胶A胶和B胶</div>
    <div>2. 调胶：按比例混合AB胶，缓慢搅拌3-5分钟至完全透明，静置消泡</div>
    <div>3. 逐层制作：从最底层开始，先倒入薄层胶，再放置材料，每层需等初固后再进行下一层</div>
    <div>4. 消泡处理：用热风枪或牙签挑破表面气泡，也可抽真空处理</div>
    <div>5. 固化完成：最后一层完成后，放置于阴凉干燥处完全固化24-48小时后方可脱模</div>
    <div style="margin-top:8px; color:#C9A96E;">※ 本清单仅为参考，实际胶量和固化时间受环境温度、材料特性影响，请根据实际情况调整</div>
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 300)
    }
    setShowExportMenu(false)
  }

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        height: 56,
        background: '#3D2B1F',
        borderBottom: '1px solid rgba(201,169,110,0.2)',
      }}
    >
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg font-bold" style={{ color: '#C9A96E' }}>
          滴胶排版预览器
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
        >
          <Save size={14} />
          保存方案
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSchemeList(!showSchemeList)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            <FolderOpen size={14} />
            方案列表
            {schemes.length > 0 && (
              <span
                className="rounded-full px-1.5 text-xs"
                style={{ background: 'rgba(201,169,110,0.3)', color: '#C9A96E' }}
              >
                {schemes.length}
              </span>
            )}
          </button>

          {showSchemeList && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg shadow-xl z-20"
              style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)', minWidth: 220, maxHeight: 300, overflow: 'auto' }}
            >
              {schemes.length === 0 && (
                <div className="px-4 py-3 text-xs" style={{ color: '#8B7355' }}>暂无保存的方案</div>
              )}
              {schemes.map((s) => {
                const reviews = getReviewsBySchemeId(s.id)
                return (
                  <div
                    key={s.id}
                    className="px-3 py-2"
                    style={{
                      background: s.id === currentSchemeId ? 'rgba(201,169,110,0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(201,169,110,0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => { loadScheme(s.id); setShowSchemeList(false) }}
                        className="flex-1 text-left text-xs"
                        style={{ color: '#FFF8F0' }}
                      >
                        {s.name}
                        <span className="ml-2" style={{ color: '#8B7355' }}>
                          {MOLD_SHAPE_MAP[s.moldType].label}
                        </span>
                      </button>
                      <button onClick={() => deleteScheme(s.id)} style={{ color: '#8B7355' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {reviews.length > 0 ? (
                        <button
                          onClick={() => { handleEditReview(reviews[0].id); setShowSchemeList(false) }}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: '#6B8E6B' }}
                        >
                          <Edit size={11} />
                          查看复盘 ({reviews.length})
                        </button>
                      ) : (
                        <button
                          onClick={() => { handleOpenReview(s.id) }}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: '#C9A96E' }}
                        >
                          <Plus size={11} />
                          创建复盘
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            <Download size={14} />
            导出
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg shadow-xl z-20"
              style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)', minWidth: 180 }}
            >
              <button
                onClick={handleExportImage}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-left transition-colors"
                style={{ color: '#FFF8F0' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Download size={14} />
                导出排版图 (PNG)
              </button>
              <button
                onClick={handlePrintMaterialList}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-left transition-colors"
                style={{ color: '#FFF8F0' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,110,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Printer size={14} />
                打印材料清单
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComparison(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(135,206,235,0.15)', color: '#87CEEB', border: '1px solid rgba(135,206,235,0.25)' }}
        >
          <GitCompare size={14} />
          方案对比
        </button>

        <button
          onClick={() => setShowKnowledgeDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(107,142,107,0.15)', color: '#6B8E6B', border: '1px solid rgba(107,142,107,0.25)' }}
        >
          <BookOpen size={14} />
          知识库
          {knowledgeCards.length > 0 && (
            <span className="rounded-full px-1.5 text-xs" style={{ background: 'rgba(107,142,107,0.3)', color: '#6B8E6B' }}>
              {knowledgeCards.length}
            </span>
          )}
        </button>

        {currentSchemeId && (
          <button
            onClick={() => handleOpenReview(currentSchemeId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <ClipboardList size={14} />
            复盘
          </button>
        )}

        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          清空画布
        </button>
      </div>

      <SchemeComparison open={showComparison} onClose={() => setShowComparison(false)} />

      <KnowledgeDrawer
        open={showKnowledgeDrawer}
        onClose={() => setShowKnowledgeDrawer(false)}
        knowledgeCards={knowledgeCards}
        reviewRecords={reviewRecords}
        onViewReview={(reviewId) => {
          setViewingReviewId(reviewId)
        }}
      />

      {reviewSchemeId && (
        <ReviewEditor
          open={showReviewEditor}
          onClose={() => {
            setShowReviewEditor(false)
            setEditingReviewId(null)
          }}
          onSave={handleSaveReview}
          editRecord={editingReviewId ? reviewRecords.find((r) => r.id === editingReviewId) || null : null}
          schemeId={reviewSchemeId}
          schemeName={schemes.find((s) => s.id === reviewSchemeId)?.name || ''}
          moldType={schemes.find((s) => s.id === reviewSchemeId)?.moldType || currentMoldType}
          layers={schemes.find((s) => s.id === reviewSchemeId)?.layers || layers}
          stages={schemes.find((s) => s.id === reviewSchemeId)?.stages || stages}
          ambientTemp={schemes.find((s) => s.id === reviewSchemeId)?.ambientTemp || ambientTemp}
        />
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl p-6" style={{ background: '#4A3728', border: '1px solid rgba(201,169,110,0.3)', minWidth: 360 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#FFF8F0' }}>保存排版方案</h3>
              <button onClick={() => setShowSaveDialog(false)} style={{ color: '#8B7355' }}>
                <X size={16} />
              </button>
            </div>
            <input
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="输入方案名称..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#FFF8F0', border: '1px solid rgba(201,169,110,0.3)' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(0,0,0,0.2)', color: '#8B7355' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(201,169,110,0.25)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
