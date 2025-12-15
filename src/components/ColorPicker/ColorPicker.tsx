import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import styles from './ColorPicker.module.css'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  onClose?: () => void
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }
  return [h, s, v]
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

// Parse any color string to RGB
function parseColor(color: string): [number, number, number] | null {
  // Try hex
  const hex = hexToRgb(color)
  if (hex) return hex

  // Try rgb(r, g, b)
  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
  }

  // Try hsl(h, s%, l%)
  const hslMatch = color.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i)
  if (hslMatch) {
    const h = parseInt(hslMatch[1])
    const s = parseInt(hslMatch[2]) / 100
    const l = parseInt(hslMatch[3]) / 100
    // HSL to RGB conversion
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x }
    else if (h < 120) { r = x; g = c }
    else if (h < 180) { g = c; b = x }
    else if (h < 240) { g = x; b = c }
    else if (h < 300) { r = x; b = c }
    else { r = c; b = x }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
  }

  return null
}

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const initialRgb = parseColor(color) || [99, 102, 241]
  const initialHsv = rgbToHsv(...initialRgb)
  
  const [hue, setHue] = useState(initialHsv[0])
  const [saturation, setSaturation] = useState(initialHsv[1])
  const [brightness, setBrightness] = useState(initialHsv[2])
  const [inputValue, setInputValue] = useState(color)
  const [inputType, setInputType] = useState<'hex' | 'rgb' | 'hsl'>('hex')
  
  const satBrightRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const isDraggingSatBright = useRef(false)
  const isDraggingHue = useRef(false)

  const currentRgb = hsvToRgb(hue, saturation, brightness)
  const currentHex = rgbToHex(...currentRgb)

  // Update input value when color changes internally
  useEffect(() => {
    if (inputType === 'hex') {
      setInputValue(currentHex)
    } else if (inputType === 'rgb') {
      setInputValue(`rgb(${currentRgb.join(', ')})`)
    } else {
      const [h, s, v] = rgbToHsv(...currentRgb)
      const l = v * (1 - s / 2)
      const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
      setInputValue(`hsl(${Math.round(h)}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%)`)
    }
  }, [hue, saturation, brightness, inputType, currentHex, currentRgb])

  // Notify parent of color change
  useEffect(() => {
    onChange(currentHex)
  }, [currentHex, onChange])

  const handleSatBrightMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingSatBright.current = true
    updateSatBright(e)
  }, [])

  const handleHueMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingHue.current = true
    updateHue(e)
  }, [])

  const updateSatBright = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!satBrightRef.current) return
    const rect = satBrightRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setSaturation(x)
    setBrightness(1 - y)
  }, [])

  const updateHue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHue(x * 360)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSatBright.current) updateSatBright(e)
      if (isDraggingHue.current) updateHue(e)
    }
    const handleMouseUp = () => {
      isDraggingSatBright.current = false
      isDraggingHue.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateSatBright, updateHue])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    const rgb = parseColor(value)
    if (rgb) {
      const [h, s, v] = rgbToHsv(...rgb)
      setHue(h)
      setSaturation(s)
      setBrightness(v)
    }
  }

  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ]

  return (
    <motion.div 
      className={styles.picker}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Saturation & Brightness Panel */}
      <div
        ref={satBrightRef}
        className={styles.satBrightPanel}
        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        onMouseDown={handleSatBrightMouseDown}
      >
        <div className={styles.satOverlay} />
        <div className={styles.brightOverlay} />
        <div
          className={styles.satBrightHandle}
          style={{
            left: `${saturation * 100}%`,
            top: `${(1 - brightness) * 100}%`,
            backgroundColor: currentHex
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        ref={hueRef}
        className={styles.hueSlider}
        onMouseDown={handleHueMouseDown}
      >
        <div
          className={styles.hueHandle}
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>

      {/* Color Preview & Input */}
      <div className={styles.inputSection}>
        <div 
          className={styles.preview}
          style={{ backgroundColor: currentHex }}
        />
        <div className={styles.inputGroup}>
          <select 
            className={styles.typeSelect}
            value={inputType}
            onChange={e => setInputType(e.target.value as 'hex' | 'rgb' | 'hsl')}
          >
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </select>
          <input
            type="text"
            className={styles.colorInput}
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onClose?.()}
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div className={styles.presets}>
        {presetColors.map(preset => (
          <button
            key={preset}
            className={`${styles.presetBtn} ${preset === currentHex ? styles.presetActive : ''}`}
            style={{ backgroundColor: preset }}
            onClick={() => handleInputChange(preset)}
          />
        ))}
      </div>

      {/* RGB Sliders */}
      <div className={styles.rgbSliders}>
        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>R</span>
          <input
            type="range"
            min="0"
            max="255"
            value={currentRgb[0]}
            onChange={e => {
              const newRgb: [number, number, number] = [parseInt(e.target.value), currentRgb[1], currentRgb[2]]
              const [h, s, v] = rgbToHsv(...newRgb)
              setHue(h); setSaturation(s); setBrightness(v)
            }}
            className={styles.rgbSlider}
            style={{ '--slider-color': '#ef4444' } as React.CSSProperties}
          />
          <span className={styles.sliderValue}>{currentRgb[0]}</span>
        </div>
        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>G</span>
          <input
            type="range"
            min="0"
            max="255"
            value={currentRgb[1]}
            onChange={e => {
              const newRgb: [number, number, number] = [currentRgb[0], parseInt(e.target.value), currentRgb[2]]
              const [h, s, v] = rgbToHsv(...newRgb)
              setHue(h); setSaturation(s); setBrightness(v)
            }}
            className={styles.rgbSlider}
            style={{ '--slider-color': '#22c55e' } as React.CSSProperties}
          />
          <span className={styles.sliderValue}>{currentRgb[1]}</span>
        </div>
        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>B</span>
          <input
            type="range"
            min="0"
            max="255"
            value={currentRgb[2]}
            onChange={e => {
              const newRgb: [number, number, number] = [currentRgb[0], currentRgb[1], parseInt(e.target.value)]
              const [h, s, v] = rgbToHsv(...newRgb)
              setHue(h); setSaturation(s); setBrightness(v)
            }}
            className={styles.rgbSlider}
            style={{ '--slider-color': '#3b82f6' } as React.CSSProperties}
          />
          <span className={styles.sliderValue}>{currentRgb[2]}</span>
        </div>
      </div>
    </motion.div>
  )
}
