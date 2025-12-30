import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Announcement } from './components/Announcement'
import { CategoryTabs } from './components/CategoryTabs'
import { Toolbar } from './components/Toolbar'
import { CardList } from './components/CardList'
import { BatchActions } from './components/BatchActions'
import { ImportModal } from './components/ImportModal'
import { Toast, type ToastData } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Loading } from './components/Loading'
import { useSettings } from './hooks/useSettings'
import { useCategories } from './hooks/useCategories'
import { useCards } from './hooks/useCards'
import { writeToClipboard } from './utils/clipboard'
import type { FilterStatus } from './types'
import './App.css'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  type: 'danger' | 'warning' | 'info'
  onConfirm: () => void
}

function App() {
  const { settings, loading: settingsLoading, error: settingsError, updateAnnouncement } = useSettings()
  const { categories, loading: categoriesLoading, error: categoriesError, addCategory, updateCategory, deleteCategory } = useCategories()
  const { 
    cards, 
    loading: cardsLoading,
    error: cardsError,
    addCards, 
    updateCard, 
    deleteCard, 
    deleteCards, 
    batchUpdateCards,
    filterCards,
    exportCards 
  } = useCards()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showImportModal, setShowImportModal] = useState(false)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  })

  // 全局加载状态
  const isLoading = settingsLoading || categoriesLoading || cardsLoading

  // 显示错误提示
  useEffect(() => {
    if (settingsError) showToast('error', settingsError)
  }, [settingsError])
  
  useEffect(() => {
    if (categoriesError) showToast('error', categoriesError)
  }, [categoriesError])
  
  useEffect(() => {
    if (cardsError) showToast('error', cardsError)
  }, [cardsError])

  const showToast = useCallback((type: ToastData['type'], message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfirmDialog({ isOpen: true, title, message, type, onConfirm })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const filteredCards = useMemo(() => {
    return filterCards(cards, selectedCategory, filterStatus, searchQuery)
  }, [cards, selectedCategory, filterStatus, searchQuery, filterCards])

  // Get unused cards in the current category for random pick
  const unusedCardsInCategory = useMemo(() => {
    return cards.filter(card => {
      if (card.isUsed) return false
      if (selectedCategory === null) return true // All categories
      if (selectedCategory === 'uncategorized') return card.categoryId === null
      return card.categoryId === selectedCategory
    })
  }, [cards, selectedCategory])

  // 计算每个分类的卡密数量
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: cards.length,
      uncategorized: cards.filter(c => c.categoryId === null).length
    }
    categories.forEach(cat => {
      counts[cat.id] = cards.filter(c => c.categoryId === cat.id).length
    })
    return counts
  }, [cards, categories])

  const handleSelectCard = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredCards.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBatchSetCategory = async (categoryId: string | null) => {
    const categoryName = categoryId
      ? categories.find(c => c.id === categoryId)?.name || '未知'
      : '未分类'
    try {
      await batchUpdateCards(Array.from(selectedIds), { categoryId })
      showToast('success', `已将 ${selectedIds.size} 条卡密设为「${categoryName}」`)
    } catch (err) {
      console.error('Batch set category failed:', err)
      showToast('error', '批量设置分类失败')
    }
  }

  const handleBatchSetRemark = async (remark: string) => {
    try {
      await batchUpdateCards(Array.from(selectedIds), { remark })
      showToast('success', `已为 ${selectedIds.size} 条卡密设置备注`)
    } catch (err) {
      console.error('Batch set remark failed:', err)
      showToast('error', '批量设置备注失败')
    }
  }

  const handleBatchSetUsedBy = async (usedBy: string) => {
    try {
      await batchUpdateCards(Array.from(selectedIds), { usedBy })
      showToast('success', `已为 ${selectedIds.size} 条卡密设置使用者`)
    } catch (err) {
      console.error('Batch set usedBy failed:', err)
      showToast('error', '批量设置使用者失败')
    }
  }

  const handleBatchMarkUsed = async (isUsed: boolean) => {
    try {
      await batchUpdateCards(Array.from(selectedIds), { isUsed })
      showToast('success', `已将 ${selectedIds.size} 条卡密标记为${isUsed ? '已使用' : '未使用'}`)
    } catch (err) {
      console.error('Batch mark used failed:', err)
      showToast('error', '批量标记失败')
    }
  }

  const handleBatchDelete = () => {
    const count = selectedIds.size
    showConfirm(
      '确认删除',
      `确定要删除选中的 ${count} 条卡密吗？此操作不可撤销。`,
      async () => {
        try {
          await deleteCards(Array.from(selectedIds))
          setSelectedIds(new Set())
          showToast('success', `已删除 ${count} 条卡密`)
        } catch {
          showToast('error', '删除失败')
        }
        closeConfirm()
      },
      'danger'
    )
  }

  // 单个卡密删除处理（使用确认弹窗）
  const handleDeleteCard = (id: string) => {
    showConfirm(
      '确认删除',
      '确定要删除这条卡密吗？此操作不可撤销。',
      async () => {
        try {
          await deleteCard(id)
          // 清理选中状态
          setSelectedIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          showToast('success', '卡密已删除')
        } catch {
          showToast('error', '删除失败')
        }
        closeConfirm()
      },
      'danger'
    )
  }

  // 删除分类处理（使用确认弹窗）
  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id)
    showConfirm(
      '确认删除分类',
      `确定要删除分类「${category?.name || ''}」吗？相关卡密将变为未分类状态。`,
      async () => {
        try {
          await deleteCategory(id)
          if (selectedCategory === id) {
            setSelectedCategory(null)
          }
          showToast('success', '分类已删除')
        } catch {
          showToast('error', '删除失败')
        }
        closeConfirm()
      },
      'warning'
    )
  }

  const handleExport = async (includeInfo: boolean) => {
    const cardsToExport = selectedIds.size > 0 
      ? filteredCards.filter(c => selectedIds.has(c.id))
      : filteredCards
    
    if (cardsToExport.length === 0) {
      showToast('error', '没有可导出的卡密')
      return
    }
    
    const text = exportCards(cardsToExport, includeInfo)
    try {
      await writeToClipboard(text)
      showToast('success', `已复制 ${cardsToExport.length} 条卡密到剪贴板`)
    } catch {
      showToast('error', '复制到剪贴板失败')
    }
  }

  const handleRandomPick = async () => {
    if (unusedCardsInCategory.length === 0) {
      showToast('error', '当前分类没有未使用的卡密')
      return
    }

    // Random pick one card
    const randomIndex = Math.floor(Math.random() * unusedCardsInCategory.length)
    const pickedCard = unusedCardsInCategory[randomIndex]

    try {
      // Copy to clipboard
      await writeToClipboard(pickedCard.code)
      
      // Mark as used
      await updateCard(pickedCard.id, { isUsed: true })
      
      showToast('success', `已随机取卡并复制: ${pickedCard.code.slice(0, 20)}${pickedCard.code.length > 20 ? '...' : ''}`)
    } catch {
      showToast('error', '随机取卡失败')
    }
  }

  // 显示加载状态
  if (isLoading) {
    return <Loading fullScreen text="正在加载数据..." />
  }

  return (
    <div className="app">
      <motion.header 
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="app-logo">
          <span className="logo-icon">🔐</span>
          <h1>卡密管家</h1>
        </div>
      </motion.header>

      <main className="app-main">
        <div className="container">
          {settings && (
            <Announcement 
              content={settings.announcement} 
              onUpdate={updateAnnouncement} 
            />
          )}

          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            onImportClick={() => setShowImportModal(true)}
            onExportClick={handleExport}
            onRandomPick={handleRandomPick}
            totalCount={cards.length}
            filteredCount={filteredCards.length}
            unusedInCategoryCount={unusedCardsInCategory.length}
          />

          <CategoryTabs
            categories={categories}
            categoryCounts={categoryCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={handleDeleteCategory}
          />

          <CardList
            cards={filteredCards}
            categories={categories}
            selectedIds={selectedIds}
            onSelectCard={handleSelectCard}
            onSelectAll={handleSelectAll}
            onUpdateCard={updateCard}
            onDeleteCard={handleDeleteCard}
          />
        </div>
      </main>

      <BatchActions
        selectedCount={selectedIds.size}
        categories={categories}
        onSetCategory={handleBatchSetCategory}
        onSetRemark={handleBatchSetRemark}
        onSetUsedBy={handleBatchSetUsedBy}
        onMarkUsed={handleBatchMarkUsed}
        onDelete={handleBatchDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={addCards}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
