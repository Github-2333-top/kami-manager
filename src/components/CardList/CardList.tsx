import { AnimatePresence, motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { CardItem } from '../CardItem'
import type { Card, Category } from '../../types'
import styles from './CardList.module.css'

interface CardListProps {
  cards: Card[]
  categories: Category[]
  selectedIds: Set<string>
  onSelectCard: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onUpdateCard: (id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => void
  onDeleteCard: (id: string) => void
}

export function CardList({
  cards,
  categories,
  selectedIds,
  onSelectCard,
  onSelectAll,
  onUpdateCard,
  onDeleteCard
}: CardListProps) {
  const allSelected = cards.length > 0 && selectedIds.size === cards.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < cards.length

  const getCategoryById = (id: string | null) => {
    if (!id) return null
    return categories.find(c => c.id === id) || null
  }

  if (cards.length === 0) {
    return (
      <motion.div 
        className={styles.empty}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.emptyIcon}>
          <Package size={48} />
        </div>
        <h3>暂无卡密</h3>
        <p>点击"导入卡密"按钮从剪贴板批量导入</p>
      </motion.div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerCheckbox}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={e => onSelectAll(e.target.checked)}
            className={styles.checkboxInput}
          />
          <div className={`${styles.checkboxCustom} ${allSelected ? styles.checked : ''} ${someSelected ? styles.indeterminate : ''}`}>
            {allSelected && <span>✓</span>}
            {someSelected && <span>−</span>}
          </div>
        </div>
        <div className={styles.headerCode}>卡密代码</div>
        <div className={styles.headerCategory}>分类</div>
        <div className={styles.headerRemark}>备注</div>
        <div className={styles.headerUsedBy}>使用者</div>
        <div className={styles.headerStatus}>状态</div>
        <div className={styles.headerActions}>操作</div>
      </div>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              category={getCategoryById(card.categoryId)}
              categories={categories}
              isSelected={selectedIds.has(card.id)}
              onSelect={selected => onSelectCard(card.id, selected)}
              onUpdate={updates => onUpdateCard(card.id, updates)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

