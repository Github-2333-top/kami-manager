import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Edit3, Check, X } from 'lucide-react'
import { parseTextWithLinks } from '../../utils/textUtils'
import styles from './Announcement.module.css'

interface AnnouncementProps {
  content: string
  onUpdate: (content: string) => void
}

export function Announcement({ content, onUpdate }: AnnouncementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(content)
  }, [content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(content)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <motion.div 
      className={styles.announcement}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.icon}>
        <Megaphone size={18} />
      </div>
      
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            className={styles.editContainer}
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入公告内容..."
              rows={2}
            />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSave}>
                <Check size={16} />
                <span>保存</span>
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                <X size={16} />
                <span>取消</span>
              </button>
              <span className={styles.hint}>Ctrl+Enter 保存</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className={styles.displayContainer}
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onDoubleClick={() => setIsEditing(true)}
          >
            <p className={styles.content}>
              {content ? (
                parseTextWithLinks(content).map((part, index) => (
                  <React.Fragment key={index}>{part}</React.Fragment>
                ))
              ) : (
                '点击编辑按钮添加公告内容'
              )}
            </p>
            <button 
              className={styles.editBtn} 
              onClick={() => setIsEditing(true)}
              title="编辑公告"
            >
              <Edit3 size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

