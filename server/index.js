import express from 'express'
import cors from 'cors'
import { db, initDatabase } from './db.js'
import { randomUUID } from 'crypto'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ============== 设置 API ==============

// 获取设置
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE id = ?', ['main'])
    res.json(rows[0] || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新公告
app.put('/api/settings/announcement', async (req, res) => {
  try {
    const { announcement } = req.body
    await db.query('UPDATE settings SET announcement = ? WHERE id = ?', [announcement, 'main'])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============== 分类 API ==============

// 获取所有分类
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY created_at')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 添加分类
app.post('/api/categories', async (req, res) => {
  try {
    const { name, color } = req.body
    const id = randomUUID()
    await db.query('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', [id, name, color])
    res.json({ id, name, color })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新分类
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, color } = req.body
    const updates = []
    const values = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (color !== undefined) { updates.push('color = ?'); values.push(color) }
    values.push(id)
    await db.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除分类
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.query('UPDATE cards SET category_id = NULL WHERE category_id = ?', [id])
    await db.query('DELETE FROM categories WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============== 卡密 API ==============

// 获取所有卡密
app.get('/api/cards', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, code, category_id as categoryId, remark, used_by as usedBy, 
             is_used as isUsed, created_at as createdAt, updated_at as updatedAt 
      FROM cards 
      ORDER BY created_at DESC
    `)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 批量添加卡密
app.post('/api/cards/batch', async (req, res) => {
  try {
    const { codes } = req.body
    const now = new Date()
    
    // 获取已存在的卡密
    const [existing] = await db.query('SELECT code FROM cards WHERE code IN (?)', [codes])
    const existingCodes = new Set(existing.map(r => r.code))
    
    // 过滤出新卡密
    const newCodes = codes.filter(code => code.trim() && !existingCodes.has(code.trim()))
    
    if (newCodes.length > 0) {
      const values = newCodes.map(code => [randomUUID(), code.trim(), now, now])
      await db.query(
        'INSERT INTO cards (id, code, created_at, updated_at) VALUES ?',
        [values]
      )
    }
    
    res.json({ added: newCodes.length, duplicates: codes.length - newCodes.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新单个卡密
app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId, remark, usedBy, isUsed } = req.body
    
    const updates = []
    const values = []
    
    if (categoryId !== undefined) { updates.push('category_id = ?'); values.push(categoryId) }
    if (remark !== undefined) { updates.push('remark = ?'); values.push(remark) }
    if (usedBy !== undefined) { updates.push('used_by = ?'); values.push(usedBy) }
    if (isUsed !== undefined) { updates.push('is_used = ?'); values.push(isUsed) }
    
    if (updates.length > 0) {
      values.push(id)
      await db.query(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values)
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 批量更新卡密
app.put('/api/cards/batch', async (req, res) => {
  try {
    const { ids, updates } = req.body
    const { categoryId, remark, usedBy, isUsed } = updates
    
    const setClause = []
    const values = []
    
    if (categoryId !== undefined) { setClause.push('category_id = ?'); values.push(categoryId) }
    if (remark !== undefined) { setClause.push('remark = ?'); values.push(remark) }
    if (usedBy !== undefined) { setClause.push('used_by = ?'); values.push(usedBy) }
    if (isUsed !== undefined) { setClause.push('is_used = ?'); values.push(isUsed) }
    
    if (setClause.length > 0 && ids.length > 0) {
      await db.query(
        `UPDATE cards SET ${setClause.join(', ')} WHERE id IN (?)`,
        [...values, ids]
      )
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除单个卡密
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.query('DELETE FROM cards WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 批量删除卡密
app.delete('/api/cards/batch', async (req, res) => {
  try {
    const { ids } = req.body
    if (ids.length > 0) {
      await db.query('DELETE FROM cards WHERE id IN (?)', [ids])
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 启动服务器
async function start() {
  try {
    console.log('正在连接 MySQL 数据库...\n')
    await initDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 后端服务已启动: http://localhost:${PORT}`)
      console.log(`📡 API 地址: http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('\n❌ 启动失败:', error.message)
    console.log('\n请检查:')
    console.log('1. MySQL 服务是否已启动')
    console.log('2. server/db.js 中的连接配置是否正确')
    process.exit(1)
  }
}

start()

