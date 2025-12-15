import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clipboard, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Modal } from '../Modal'
import { readFromClipboard, parseCardCodes } from '../../utils/clipboard'
import styles from './ImportModal.module.css'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (codes: string[]) => Promise<{ added: number; duplicates: number }>
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [textValue, setTextValue] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const codes = parseCardCodes(textValue)

  const handlePasteFromClipboard = async () => {
    try {
      const text = await readFromClipboard()
      setTextValue(text)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleImport = async () => {
    if (codes.length === 0) return
    
    setImporting(true)
    setError(null)
    
    try {
      const res = await onImport(codes)
      setResult(res)
      
      if (res.added > 0) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setTextValue('')
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="导入卡密" width="560px">
      <div className={styles.container}>
        <p className={styles.description}>
          将卡密粘贴到下方文本框，每行一个卡密。系统会自动去除空行和重复项。
        </p>

        <div className={styles.actions}>
          <motion.button 
            className={styles.pasteBtn}
            onClick={handlePasteFromClipboard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clipboard size={18} />
            从剪贴板粘贴
          </motion.button>
        </div>

        <div className={styles.textareaWrapper}>
          <textarea
            className={styles.textarea}
            value={textValue}
            onChange={e => { setTextValue(e.target.value); setResult(null); }}
            placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ-ZZZZ"
            rows={10}
          />
          {codes.length > 0 && (
            <div className={styles.preview}>
              <FileText size={16} />
              <span>检测到 <strong>{codes.length}</strong> 条卡密</span>
            </div>
          )}
        </div>

        {error && (
          <motion.div 
            className={styles.error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        {result && (
          <motion.div 
            className={styles.result}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle size={18} />
            <span>
              成功导入 <strong>{result.added}</strong> 条卡密
              {result.duplicates > 0 && `，${result.duplicates} 条重复已跳过`}
            </span>
          </motion.div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose}>
            取消
          </button>
          <motion.button 
            className={styles.importBtn}
            onClick={handleImport}
            disabled={codes.length === 0 || importing}
            whileHover={{ scale: codes.length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: codes.length > 0 ? 0.98 : 1 }}
          >
            {importing ? '导入中...' : `导入 ${codes.length} 条卡密`}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}

