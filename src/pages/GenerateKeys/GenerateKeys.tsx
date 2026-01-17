import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Download, RefreshCw, CheckCircle, AlertCircle, X, Database } from 'lucide-react'
import { TechBackground } from '../../components/TechBackground'
import { api } from '../../api/client'
import styles from './GenerateKeys.module.css'

interface GeneratedKey {
  id: number
  key: string
  createdAt: string
}

interface ToastData {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export const GenerateKeys: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [count, setCount] = useState<number>(100)
  const [prefix, setPrefix] = useState<string>('weiyi')
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewKey, setPreviewKey] = useState('')
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [progressText, setProgressText] = useState<string>('')

  // 显示 Toast 消息
  const showToast = useCallback((type: ToastData['type'], message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
    // 3秒后自动关闭
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  // 关闭 Toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // 检查数据库连接状态
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const result = await api.checkGenerateDbStatus()
        setDbConnected(result.externalDbConnected)
      } catch {
        setDbConnected(false)
      }
    }
    checkDbStatus()
  }, [])

  // 更新预览
  useEffect(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const randomPart = Array(32).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    setPreviewKey(`${prefix}${randomPart}`)
  }, [prefix])

  // 生成卡密并自动写入数据库
  const handleGenerate = async () => {
    if (dbConnected === false) {
      showToast('error', '数据库未连接，无法生成卡密')
      return
    }

    setIsGenerating(true)
    setProgressText('正在生成卡密...')
    
    try {
      // 第一步：生成卡密
      const result = await api.generateKeys(count, prefix)
      const keys = result.keys
      
      const newKeys: GeneratedKey[] = keys.map((key, index) => ({
        id: Date.now() + index,
        key,
        createdAt: new Date(result.generatedAt).toLocaleString()
      }))
      setGeneratedKeys(newKeys)
      
      // 第二步：自动写入数据库
      setProgressText(`正在写入 ${keys.length} 条卡密到数据库...`)
      const writeResult = await api.writeKeysToDb(keys)
      
      if (writeResult.insertedCount === keys.length) {
        showToast('success', `成功生成并写入 ${writeResult.insertedCount} 条卡密`)
      } else if (writeResult.insertedCount > 0) {
        showToast('info', `生成 ${keys.length} 条，写入 ${writeResult.insertedCount} 条，${writeResult.duplicateCount} 条重复已跳过`)
      } else {
        showToast('error', `生成 ${keys.length} 条卡密，但全部重复未写入`)
      }
    } catch (error: any) {
      console.error('生成卡密失败:', error)
      showToast('error', error.message || '生成卡密失败')
    } finally {
      setIsGenerating(false)
      setProgressText('')
    }
  }

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', '已复制到剪贴板')
    } catch {
      showToast('error', '复制失败')
    }
  }

  // 导出为TXT文件
  const handleExport = () => {
    const content = generatedKeys.map(k => k.key).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `card_keys_${prefix}_${new Date().getTime()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('success', `已导出 ${generatedKeys.length} 条卡密`)
  }

  return (
    <div className={styles.container}>
      <TechBackground />
      
      {/* Toast 通知 */}
      <div className={styles.toastContainer}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.type]}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <AlertCircle size={18} />}
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className={styles.toastClose}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h1 className={styles.title}>生成卡密</h1>
        {/* 数据库状态指示器 */}
        <div className={styles.dbStatus}>
          <span className={`${styles.statusDot} ${dbConnected === true ? styles.connected : dbConnected === false ? styles.disconnected : styles.checking}`} />
          <span className={styles.statusText}>
            {dbConnected === null ? '检查中...' : dbConnected ? '数据库已连接' : '数据库未连接'}
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* 配置面板 */}
          <motion.div 
            className={styles.panel}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className={styles.panelTitle}>生成配置</h2>
            
            <div className={styles.formGroup}>
              <label>卡密前缀</label>
              <input 
                type="text" 
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className={styles.input}
                placeholder="例如: weiyi"
                maxLength={50}
              />
            </div>

            <div className={styles.formGroup}>
              <label>生成数量 (1-1000)</label>
              <div className={styles.rangeWrapper}>
                <input 
                  type="range" 
                  min="1" 
                  max="1000" 
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className={styles.range}
                />
                <input 
                  type="number" 
                  min="1" 
                  max="1000" 
                  value={count}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (val >= 1 && val <= 1000) setCount(val)
                  }}
                  className={styles.numberInput}
                />
              </div>
            </div>

            <div className={styles.formatInfo}>
              <div className={styles.formatLabel}>格式预览:</div>
              <div className={styles.formatValue}>{prefix} + 32位随机字符</div>
            </div>

            <button 
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={isGenerating || !prefix || dbConnected === false}
              title={dbConnected === false ? '数据库未连接' : ''}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className={styles.spinning} size={18} />
                  <span>{progressText || '处理中...'}</span>
                </>
              ) : (
                <>
                  <Database size={18} />
                  <span>立即生成</span>
                </>
              )}
            </button>
            
            {dbConnected === false && (
              <div className={styles.warningText}>
                数据库未连接，无法生成卡密
              </div>
            )}
          </motion.div>

          {/* 预览区域 */}
          <motion.div 
            className={styles.panel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className={styles.panelTitle}>实时预览</h2>
            <div className={styles.previewBox}>
              <div className={styles.previewItem}>
                {previewKey}
              </div>
              <div className={styles.previewItem} style={{ opacity: 0.7 }}>
                {previewKey.slice(0, -5) + 'xxxxx'}
              </div>
              <div className={styles.previewItem} style={{ opacity: 0.4 }}>
                {previewKey.slice(0, -10) + 'xxxxxxxxxx'}
              </div>
            </div>
            
            <div className={styles.previewStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>卡密长度</span>
                <span className={styles.statValue}>{prefix.length + 32} 字符</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>待生成</span>
                <span className={styles.statValue}>{count} 条</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 结果列表 */}
        {generatedKeys.length > 0 && (
          <motion.div 
            className={styles.resultsPanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.resultsHeader}>
              <h3>已生成并写入 {generatedKeys.length} 条卡密</h3>
              <div className={styles.actions}>
                <button 
                  className={styles.actionButton} 
                  onClick={() => handleCopy(generatedKeys.map(k => k.key).join('\n'))}
                >
                  <Copy size={16} /> 复制全部
                </button>
                <button className={styles.actionButton} onClick={handleExport}>
                  <Download size={16} /> 导出TXT
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>序号</th>
                    <th>卡密</th>
                    <th style={{ width: '100px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedKeys.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className={styles.codeCell}>{item.key}</td>
                      <td>
                        <button 
                          className={styles.iconButton}
                          onClick={() => handleCopy(item.key)}
                          title="复制"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
