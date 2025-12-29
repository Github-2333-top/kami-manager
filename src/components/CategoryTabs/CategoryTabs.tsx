import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check, Edit3, Trash2, Palette } from 'lucide-react'
import type { Category } from '../../types'
import { ColorPicker } from '../ColorPicker'
import styles from './CategoryTabs.module.css'

interface CategoryTabsProps {
  categories: Category[]
  categoryCounts?: Record<string, number>
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  onAddCategory: (name: string, color: string) => void
  onUpdateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void
  onDeleteCategory: (id: string) => void
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

export function CategoryTabs({
  categories,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoryTabsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [showNewColorPicker, setShowNewColorPicker] = useState(false)
  const [showEditColorPicker, setShowEditColorPicker] = useState(false)

  const handleAddSubmit = () => {
    if (newName.trim()) {
      onAddCategory(newName.trim(), newColor)
      setNewName('')
      setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)])
      setIsAdding(false)
      setShowNewColorPicker(false)
    }
  }

  const handleEditStart = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
    setShowEditColorPicker(false)
  }

  const handleEditSubmit = () => {
    if (editingId && editName.trim()) {
      onUpdateCategory(editingId, { name: editName.trim(), color: editColor })
      setEditingId(null)
      setShowEditColorPicker(false)
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setShowEditColorPicker(false)
  }

  const handleDelete = (id: string) => {
    onDeleteCategory(id)
  }

  const handleNewColorChange = useCallback((color: string) => {
    setNewColor(color)
  }, [])

  const handleEditColorChange = useCallback((color: string) => {
    setEditColor(color)
  }, [])

  const getCount = (key: string) => {
    return categoryCounts?.[key] ?? 0
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <motion.button
          className={`${styles.tab} ${selectedCategory === null ? styles.active : ''}`}
          onClick={() => onSelectCategory(null)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          全部
          {categoryCounts && <span className={styles.count}>{getCount('all')}</span>}
        </motion.button>
        
        <motion.button
          className={`${styles.tab} ${selectedCategory === 'uncategorized' ? styles.active : ''}`}
          onClick={() => onSelectCategory('uncategorized')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          未分类
          {categoryCounts && <span className={styles.count}>{getCount('uncategorized')}</span>}
        </motion.button>

        <AnimatePresence>
          {categories.map(category => (
            <motion.div
              key={category.id}
              className={styles.categoryWrapper}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {editingId === category.id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    className={styles.editInput}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSubmit()
                      if (e.key === 'Escape') handleEditCancel()
                    }}
                    autoFocus
                  />
                  <div className={styles.colorPickerWrapper}>
                    <button
                      className={styles.colorTrigger}
                      style={{ backgroundColor: editColor }}
                      onClick={() => setShowEditColorPicker(!showEditColorPicker)}
                      title="选择颜色"
                    >
                      <Palette size={14} />
                    </button>
                    <AnimatePresence>
                      {showEditColorPicker && (
                        <>
                          <div 
                            className={styles.colorPickerOverlay} 
                            onClick={() => setShowEditColorPicker(false)} 
                          />
                          <div className={styles.colorPickerDropdown}>
                            <ColorPicker
                              color={editColor}
                              onChange={handleEditColorChange}
                              onClose={() => setShowEditColorPicker(false)}
                            />
                          </div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={styles.editActions}>
                    <button className={styles.confirmBtn} onClick={handleEditSubmit}>
                      <Check size={14} />
                    </button>
                    <button className={styles.cancelEditBtn} onClick={handleEditCancel}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <motion.button
                  className={`${styles.tab} ${styles.categoryTab} ${selectedCategory === category.id ? styles.active : ''}`}
                  onClick={() => onSelectCategory(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    '--category-color': category.color,
                    '--category-color-soft': `${category.color}20`
                  } as React.CSSProperties}
                >
                  <span className={styles.colorDot} style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  {categoryCounts && <span className={styles.count}>{getCount(category.id)}</span>}
                  <div className={styles.tabActions}>
                    <button
                      className={styles.tabActionBtn}
                      onClick={e => { e.stopPropagation(); handleEditStart(category); }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      className={styles.tabActionBtn}
                      onClick={e => { e.stopPropagation(); handleDelete(category.id); }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding ? (
            <motion.div
              className={styles.addForm}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="text"
                className={styles.addInput}
                placeholder="分类名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSubmit()
                  if (e.key === 'Escape') { setIsAdding(false); setShowNewColorPicker(false) }
                }}
                autoFocus
              />
              <div className={styles.colorPickerWrapper}>
                <button
                  className={styles.colorTrigger}
                  style={{ backgroundColor: newColor }}
                  onClick={() => setShowNewColorPicker(!showNewColorPicker)}
                  title="选择颜色"
                >
                  <Palette size={14} />
                </button>
                <AnimatePresence>
                  {showNewColorPicker && (
                    <>
                      <div 
                        className={styles.colorPickerOverlay} 
                        onClick={() => setShowNewColorPicker(false)} 
                      />
                      <div className={styles.colorPickerDropdown}>
                        <ColorPicker
                          color={newColor}
                          onChange={handleNewColorChange}
                          onClose={() => setShowNewColorPicker(false)}
                        />
                      </div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button className={styles.confirmBtn} onClick={handleAddSubmit}>
                <Check size={14} />
              </button>
              <button className={styles.cancelBtn} onClick={() => { setIsAdding(false); setShowNewColorPicker(false) }}>
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              className={styles.addBtn}
              onClick={() => setIsAdding(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              <span>添加分类</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
