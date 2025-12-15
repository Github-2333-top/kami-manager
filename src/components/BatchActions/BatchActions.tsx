import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, FileText, Check, Trash2, X } from 'lucide-react'
import type { Category } from '../../types'
import styles from './BatchActions.module.css'

interface BatchActionsProps {
  selectedCount: number
  categories: Category[]
  onSetCategory: (categoryId: string | null) => void
  onSetRemark: (remark: string) => void
  onMarkUsed: (isUsed: boolean) => void
  onDelete: () => void
  onClearSelection: () => void
}

export function BatchActions({
  selectedCount,
  categories,
  onSetCategory,
  onSetRemark,
  onMarkUsed,
  onDelete,
  onClearSelection
}: BatchActionsProps) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showRemarkInput, setShowRemarkInput] = useState(false)
  const [remarkValue, setRemarkValue] = useState('')

  const handleSetRemark = () => {
    onSetRemark(remarkValue)
    setRemarkValue('')
    setShowRemarkInput(false)
  }

  const handleDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedCount} 条卡密吗？此操作不可撤销。`)) {
      onDelete()
    }
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className={styles.content}>
            <div className={styles.info}>
              <span className={styles.count}>{selectedCount}</span>
              <span>项已选中</span>
              <button className={styles.clearBtn} onClick={onClearSelection}>
                <X size={16} />
                取消选择
              </button>
            </div>

            <div className={styles.actions}>
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                >
                  <Tag size={16} />
                  设置分类
                </button>
                
                {showCategoryMenu && (
                  <>
                    <div className={styles.menuOverlay} onClick={() => setShowCategoryMenu(false)} />
                    <motion.div 
                      className={styles.menu}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button onClick={() => { onSetCategory(null); setShowCategoryMenu(false); }}>
                        未分类
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => { onSetCategory(cat.id); setShowCategoryMenu(false); }}
                        >
                          <span className={styles.categoryDot} style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>

              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setShowRemarkInput(!showRemarkInput)}
                >
                  <FileText size={16} />
                  设置备注
                </button>
                
                {showRemarkInput && (
                  <>
                    <div className={styles.menuOverlay} onClick={() => setShowRemarkInput(false)} />
                    <motion.div 
                      className={styles.remarkMenu}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <input
                        type="text"
                        className={styles.remarkInput}
                        placeholder="输入备注内容..."
                        value={remarkValue}
                        onChange={e => setRemarkValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSetRemark()
                          if (e.key === 'Escape') setShowRemarkInput(false)
                        }}
                        autoFocus
                      />
                      <button className={styles.remarkSubmit} onClick={handleSetRemark}>
                        确定
                      </button>
                    </motion.div>
                  </>
                )}
              </div>

              <button className={styles.actionBtn} onClick={() => onMarkUsed(true)}>
                <Check size={16} />
                标记已用
              </button>

              <button className={styles.actionBtn} onClick={() => onMarkUsed(false)}>
                <X size={16} />
                标记未用
              </button>

              <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={handleDelete}>
                <Trash2 size={16} />
                删除
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

