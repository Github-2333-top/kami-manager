import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Edit3, Trash2, User, Tag, MoreHorizontal } from 'lucide-react'
import type { Card, Category } from '../../types'
import styles from './CardItem.module.css'

interface CardItemProps {
  card: Card
  category: Category | null
  categories: Category[]
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => void
  onDelete: () => void
}

export function CardItem({
  card,
  category,
  categories,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: CardItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [editingField, setEditingField] = useState<'remark' | 'usedBy' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingField])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(card.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = (field: 'remark' | 'usedBy') => {
    setEditValue(card[field])
    setEditingField(field)
    setShowMenu(false)
  }

  const saveEdit = () => {
    if (editingField) {
      onUpdate({ [editingField]: editValue })
      setEditingField(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditingField(null)
  }

  const handleCategoryChange = (categoryId: string | null) => {
    onUpdate({ categoryId })
    setShowCategoryMenu(false)
  }

  const toggleUsed = () => {
    onUpdate({ isUsed: !card.isUsed })
  }

  return (
    <motion.div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${card.isUsed ? styles.used : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <div className={styles.checkbox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onSelect(e.target.checked)}
          className={styles.checkboxInput}
        />
        <div className={`${styles.checkboxCustom} ${isSelected ? styles.checked : ''}`}>
          {isSelected && <Check size={12} />}
        </div>
      </div>

      <div className={styles.code} onClick={handleCopy}>
        <span className={styles.codeText}>{card.code}</span>
        <button className={styles.copyBtn} title="复制卡密">
          {copied ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
        </button>
      </div>

      <div className={styles.category}>
        <div className={styles.dropdownWrapper}>
          <button
            className={styles.categoryBtn}
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            style={category ? { 
              '--cat-color': category.color,
              '--cat-color-soft': `${category.color}20`
            } as React.CSSProperties : undefined}
          >
            {category ? (
              <>
                <span className={styles.categoryDot} style={{ backgroundColor: category.color }} />
                <span>{category.name}</span>
              </>
            ) : (
              <span className={styles.noCategory}>未分类</span>
            )}
            <Tag size={12} />
          </button>
          
          {showCategoryMenu && (
            <>
              <div className={styles.menuOverlay} onClick={() => setShowCategoryMenu(false)} />
              <motion.div 
                className={styles.categoryMenu}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  className={!card.categoryId ? styles.activeItem : ''}
                  onClick={() => handleCategoryChange(null)}
                >
                  未分类
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={card.categoryId === cat.id ? styles.activeItem : ''}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className={styles.categoryDot} style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className={styles.remark}>
        {editingField === 'remark' ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.editInput}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            placeholder="输入备注..."
          />
        ) : (
          <span 
            className={`${styles.remarkText} ${!card.remark ? styles.empty : ''}`}
            onClick={() => startEdit('remark')}
          >
            {card.remark || '点击添加备注'}
          </span>
        )}
      </div>

      <div className={styles.usedBy}>
        {editingField === 'usedBy' ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.editInput}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            placeholder="输入使用者..."
          />
        ) : (
          <span 
            className={`${styles.usedByText} ${!card.usedBy ? styles.empty : ''}`}
            onClick={() => startEdit('usedBy')}
          >
            {card.usedBy ? (
              <>
                <User size={14} />
                {card.usedBy}
              </>
            ) : '点击添加'}
          </span>
        )}
      </div>

      <div className={styles.status}>
        <button
          className={`${styles.statusBtn} ${card.isUsed ? styles.usedStatus : styles.unusedStatus}`}
          onClick={toggleUsed}
        >
          {card.isUsed ? '已使用' : '未使用'}
        </button>
      </div>

      <div className={styles.actions}>
        <div className={styles.dropdownWrapper}>
          <button
            className={styles.moreBtn}
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={18} />
          </button>
          
          {showMenu && (
            <>
              <div className={styles.menuOverlay} onClick={() => setShowMenu(false)} />
              <motion.div 
                className={styles.actionMenu}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <button onClick={() => startEdit('remark')}>
                  <Edit3 size={14} />
                  编辑备注
                </button>
                <button onClick={() => startEdit('usedBy')}>
                  <User size={14} />
                  设置使用者
                </button>
                <button onClick={toggleUsed}>
                  <Check size={14} />
                  {card.isUsed ? '标记未使用' : '标记已使用'}
                </button>
                <div className={styles.menuDivider} />
                <button className={styles.dangerItem} onClick={onDelete}>
                  <Trash2 size={14} />
                  删除
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

