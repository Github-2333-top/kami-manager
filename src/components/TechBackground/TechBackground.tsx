import React from 'react'
import { motion } from 'framer-motion'
import styles from './TechBackground.module.css'

export const TechBackground: React.FC = () => {
  return (
    <div className={styles.background}>
      <div className={styles.stars} />
      <div className={styles.grid} />
      <div className={styles.glow} />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={styles.particle}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            y: [null, Math.random() * -100],
            opacity: [null, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}
