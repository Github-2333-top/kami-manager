import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, Search, Filter, ChevronDown } from 'lucide-react'
import type { FilterStatus } from '../../types'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterStatus: FilterStatus
  onFilterStatusChange: (status: FilterStatus) => void
  onImportClick: () => void
  onExportClick: (includeInfo: boolean) => void
  totalCount: number
  filteredCount: number
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  onImportClick,
  onExportClick,
  totalCount,
  filteredCount
}: ToolbarProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const filterLabels: Record<FilterStatus, string> = {
    all: '全部状态',
    used: '已使用',
    unused: '未使用'
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <motion.button 
          className={styles.primaryBtn}
          onClick={onImportClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload size={18} />
          <span>导入卡密</span>
        </motion.button>

        <div className={styles.dropdownWrapper}>
          <motion.button 
            className={styles.secondaryBtn}
            onClick={() => setShowExportMenu(!showExportMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
            <span>导出</span>
            <ChevronDown size={16} />
          </motion.button>
          
          {showExportMenu && (
            <>
              <div className={styles.dropdownOverlay} onClick={() => setShowExportMenu(false)} />
              <motion.div 
                className={styles.dropdownMenu}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <button onClick={() => { onExportClick(false); setShowExportMenu(false); }}>
                  仅导出卡密
                </button>
                <button onClick={() => { onExportClick(true); setShowExportMenu(false); }}>
                  导出卡密+备注信息
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索卡密、备注、使用者..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              className={styles.clearBtn}
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.dropdownWrapper}>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter size={16} />
            <span>{filterLabels[filterStatus]}</span>
            <ChevronDown size={14} />
          </button>
          
          {showFilterMenu && (
            <>
              <div className={styles.dropdownOverlay} onClick={() => setShowFilterMenu(false)} />
              <motion.div 
                className={styles.dropdownMenu}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {(['all', 'used', 'unused'] as FilterStatus[]).map(status => (
                  <button
                    key={status}
                    className={filterStatus === status ? styles.activeFilter : ''}
                    onClick={() => { onFilterStatusChange(status); setShowFilterMenu(false); }}
                  >
                    {filterLabels[status]}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>

        <div className={styles.stats}>
          显示 <strong>{filteredCount}</strong> / {totalCount} 条
        </div>
      </div>
    </div>
  )
}

