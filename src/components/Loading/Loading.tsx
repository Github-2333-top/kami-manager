import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import styles from './Loading.module.css'

interface LoadingProps {
  text?: string
  fullScreen?: boolean
}

export function Loading({ text = '加载中...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className={styles.content}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 size={32} className={styles.spinner} />
      </motion.div>
      <p className={styles.text}>{text}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        {content}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {content}
    </div>
  )
}

