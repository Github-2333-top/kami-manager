import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Announcement } from './components/Announcement'
import { CategoryTabs } from './components/CategoryTabs'
import { Toolbar } from './components/Toolbar'
import { CardList } from './components/CardList'
import { BatchActions } from './components/BatchActions'
import { ImportModal } from './components/ImportModal'
import { Toast, type ToastData } from './components/Toast'
import { useSettings } from './hooks/useSettings'
import { useCategories } from './hooks/useCategories'
import { useCards } from './hooks/useCards'
import { writeToClipboard } from './utils/clipboard'
import type { FilterStatus } from './types'
import './App.css'

function App() {
  const { settings, updateAnnouncement } = useSettings()
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const { 
    cards, 
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

  const showToast = useCallback((type: ToastData['type'], message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const filteredCards = useMemo(() => {
    return filterCards(cards, selectedCategory, filterStatus, searchQuery)
  }, [cards, selectedCategory, filterStatus, searchQuery, filterCards])

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

  const handleBatchSetCategory = (categoryId: string | null) => {
    batchUpdateCards(Array.from(selectedIds), { categoryId })
    const categoryName = categoryId 
      ? categories.find(c => c.id === categoryId)?.name || '未知'
      : '未分类'
    showToast('success', `已将 ${selectedIds.size} 条卡密设为「${categoryName}」`)
  }

  const handleBatchSetRemark = (remark: string) => {
    batchUpdateCards(Array.from(selectedIds), { remark })
    showToast('success', `已为 ${selectedIds.size} 条卡密设置备注`)
  }

  const handleBatchMarkUsed = (isUsed: boolean) => {
    batchUpdateCards(Array.from(selectedIds), { isUsed })
    showToast('success', `已将 ${selectedIds.size} 条卡密标记为${isUsed ? '已使用' : '未使用'}`)
  }

  const handleBatchDelete = () => {
    const count = selectedIds.size
    deleteCards(Array.from(selectedIds))
    setSelectedIds(new Set())
    showToast('success', `已删除 ${count} 条卡密`)
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
            totalCount={cards.length}
            filteredCount={filteredCards.length}
          />

          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />

          <CardList
            cards={filteredCards}
            categories={categories}
            selectedIds={selectedIds}
            onSelectCard={handleSelectCard}
            onSelectAll={handleSelectAll}
            onUpdateCard={updateCard}
            onDeleteCard={deleteCard}
          />
        </div>
      </main>

      <BatchActions
        selectedCount={selectedIds.size}
        categories={categories}
        onSetCategory={handleBatchSetCategory}
        onSetRemark={handleBatchSetRemark}
        onMarkUsed={handleBatchMarkUsed}
        onDelete={handleBatchDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={addCards}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
