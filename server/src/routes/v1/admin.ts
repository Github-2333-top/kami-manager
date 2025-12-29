import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../../db.js'
import { sendSuccess, sendError } from '../../utils/response.js'

const router = Router()

/**
 * GET /api/v1/health
 * 健康检查
 */
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    sendSuccess(
      res,
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      },
      '服务正常'
    )
  } catch (error: any) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      }
    })
  }
})

/**
 * GET /api/v1/stats
 * 获取统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM cards') as any[]
    const [[{ usedCount }]] = await db.query('SELECT COUNT(*) as usedCount FROM cards WHERE is_used = true') as any[]
    const [[{ unusedCount }]] = await db.query('SELECT COUNT(*) as unusedCount FROM cards WHERE is_used = false') as any[]
    const [[{ uncategorizedCount }]] = await db.query('SELECT COUNT(*) as uncategorizedCount FROM cards WHERE category_id IS NULL') as any[]

    const [categoryStats] = await db.query(`
      SELECT c.id, c.name, c.color, COUNT(cards.id) as count 
      FROM categories c 
      LEFT JOIN cards ON cards.category_id = c.id 
      GROUP BY c.id, c.name, c.color
      ORDER BY c.created_at
    `)

    sendSuccess(res, {
      total,
      usedCount,
      unusedCount,
      uncategorizedCount,
      categoryStats
    }, '获取统计数据成功')
  } catch (error: any) {
    console.error('获取统计数据失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取统计数据失败', null, 500)
  }
})

/**
 * GET /api/v1/settings
 * 获取设置
 */
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE id = ?', ['main'])
    const settings = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    sendSuccess(res, settings, '获取设置成功')
  } catch (error: any) {
    console.error('获取设置失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取设置失败', null, 500)
  }
})

/**
 * PUT /api/v1/settings/announcement
 * 更新公告
 */
router.put('/settings/announcement', async (req, res) => {
  try {
    const { announcement } = req.body

    if (typeof announcement !== 'string') {
      return sendError(res, 'INVALID_PARAMETER', '公告内容必须是字符串', null, 400)
    }
    if (announcement.length > 1000) {
      return sendError(res, 'INVALID_PARAMETER', '公告内容不能超过1000个字符', null, 400)
    }

    await db.query('UPDATE settings SET announcement = ? WHERE id = ?', [announcement, 'main'])
    sendSuccess(res, null, '公告更新成功')
  } catch (error: any) {
    console.error('更新公告失败:', error)
    sendError(res, 'INTERNAL_ERROR', '更新公告失败', null, 500)
  }
})

/**
 * GET /api/v1/categories
 * 获取所有分类
 */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY created_at')
    sendSuccess(res, rows, '获取分类列表成功')
  } catch (error: any) {
    console.error('获取分类列表失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取分类列表失败', null, 500)
  }
})

/**
 * POST /api/v1/categories
 * 添加分类
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, color } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, 'INVALID_PARAMETER', '分类名称不能为空', null, 400)
    }
    if (name.length > 50) {
      return sendError(res, 'INVALID_PARAMETER', '分类名称不能超过50个字符', null, 400)
    }
    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的颜色值（如 #ff0000）', null, 400)
    }

    const id = randomUUID()
    await db.query('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', [id, name.trim(), color])
    sendSuccess(res, { id, name: name.trim(), color }, '分类添加成功', 201)
  } catch (error: any) {
    console.error('添加分类失败:', error)
    sendError(res, 'INTERNAL_ERROR', '添加分类失败', null, 500)
  }
})

/**
 * PUT /api/v1/categories/:id
 * 更新分类
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, color } = req.body

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'INVALID_PARAMETER', '分类名称不能为空', null, 400)
      }
      if (name.length > 50) {
        return sendError(res, 'INVALID_PARAMETER', '分类名称不能超过50个字符', null, 400)
      }
    }
    if (color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的颜色值（如 #ff0000）', null, 400)
    }

    const updates: string[] = []
    const values: any[] = []
    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name.trim())
    }
    if (color !== undefined) {
      updates.push('color = ?')
      values.push(color)
    }

    if (updates.length === 0) {
      return sendError(res, 'INVALID_PARAMETER', '请提供要更新的字段', null, 400)
    }

    values.push(id)
    await db.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values)
    sendSuccess(res, null, '分类更新成功')
  } catch (error: any) {
    console.error('更新分类失败:', error)
    sendError(res, 'INTERNAL_ERROR', '更新分类失败', null, 500)
  }
})

/**
 * DELETE /api/v1/categories/:id
 * 删除分类
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.query('UPDATE cards SET category_id = NULL WHERE category_id = ?', [id])
    await db.query('DELETE FROM categories WHERE id = ?', [id])
    sendSuccess(res, null, '分类删除成功')
  } catch (error: any) {
    console.error('删除分类失败:', error)
    sendError(res, 'INTERNAL_ERROR', '删除分类失败', null, 500)
  }
})

/**
 * GET /api/v1/cards
 * 获取所有卡密（支持分页和筛选）
 */
router.get('/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 0
    const offset = (page - 1) * limit

    let query = `
      SELECT id, code, category_id as categoryId, remark, used_by as usedBy, 
             is_used as isUsed, created_at as createdAt, updated_at as updatedAt 
      FROM cards 
      ORDER BY created_at DESC
    `

    if (limit > 0) {
      query += ` LIMIT ${limit} OFFSET ${offset}`
    }

    const [rows] = await db.query(query)

    if (limit > 0) {
      const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM cards') as any[]
      sendSuccess(res, {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, '获取卡密列表成功')
    } else {
      sendSuccess(res, rows, '获取卡密列表成功')
    }
  } catch (error: any) {
    console.error('获取卡密列表失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取卡密列表失败', null, 500)
  }
})

/**
 * POST /api/v1/cards/batch
 * 批量添加卡密
 */
router.post('/cards/batch', async (req, res) => {
  try {
    const { codes, categoryId } = req.body

    if (!codes || !Array.isArray(codes)) {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的卡密数组', null, 400)
    }

    if (codes.length === 0) {
      return sendSuccess(res, { added: 0, duplicates: 0 }, '批量添加完成')
    }

    const now = new Date()
    const validCodes = codes.filter((code: any) => code && typeof code === 'string' && code.trim())

    if (validCodes.length === 0) {
      return sendSuccess(res, { added: 0, duplicates: 0 }, '批量添加完成')
    }

    const [existing] = await db.query('SELECT code FROM cards WHERE code IN (?)', [validCodes]) as any[]
    const existingCodes = new Set(existing.map((r: any) => r.code))

    const newCodes = validCodes.filter((code: string) => !existingCodes.has(code.trim()))

    if (newCodes.length > 0) {
      const values = newCodes.map((code: string) => [
        randomUUID(),
        code.trim(),
        categoryId || null,
        now,
        now
      ])
      await db.query(
        'INSERT INTO cards (id, code, category_id, created_at, updated_at) VALUES ?',
        [values]
      )
    }

    sendSuccess(res, {
      added: newCodes.length,
      duplicates: validCodes.length - newCodes.length
    }, '批量添加完成')
  } catch (error: any) {
    console.error('批量添加卡密失败:', error)
    sendError(res, 'INTERNAL_ERROR', '批量添加卡密失败', null, 500)
  }
})

/**
 * PUT /api/v1/cards/:id
 * 更新单个卡密
 */
router.put('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId, remark, usedBy, isUsed } = req.body

    const updates: string[] = []
    const values: any[] = []

    if (categoryId !== undefined) {
      updates.push('category_id = ?')
      values.push(categoryId)
    }
    if (remark !== undefined) {
      updates.push('remark = ?')
      values.push(remark)
    }
    if (usedBy !== undefined) {
      updates.push('used_by = ?')
      values.push(usedBy)
    }
    if (isUsed !== undefined) {
      updates.push('is_used = ?')
      values.push(isUsed)
    }

    if (updates.length > 0) {
      values.push(id)
      await db.query(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    sendSuccess(res, null, '卡密更新成功')
  } catch (error: any) {
    console.error('更新卡密失败:', error)
    sendError(res, 'INTERNAL_ERROR', '更新卡密失败', null, 500)
  }
})

/**
 * PUT /api/v1/cards/batch
 * 批量更新卡密
 */
router.put('/cards/batch', async (req, res) => {
  try {
    const { ids, updates } = req.body

    if (!ids || !Array.isArray(ids)) {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的ID数组', null, 400)
    }
    if (!updates || typeof updates !== 'object') {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的更新数据', null, 400)
    }
    if (ids.length === 0) {
      return sendSuccess(res, { updated: 0 }, '批量更新完成')
    }

    const { categoryId, remark, usedBy, isUsed } = updates

    const setClause: string[] = []
    const values: any[] = []

    if (categoryId !== undefined) {
      setClause.push('category_id = ?')
      values.push(categoryId)
    }
    if (remark !== undefined) {
      setClause.push('remark = ?')
      values.push(remark)
    }
    if (usedBy !== undefined) {
      setClause.push('used_by = ?')
      values.push(usedBy)
    }
    if (isUsed !== undefined) {
      setClause.push('is_used = ?')
      values.push(isUsed)
    }

    if (setClause.length === 0) {
      return sendError(res, 'INVALID_PARAMETER', '请提供要更新的字段', null, 400)
    }

    await db.query(
      `UPDATE cards SET ${setClause.join(', ')} WHERE id IN (?)`,
      [...values, ids]
    )

    sendSuccess(res, { updated: ids.length }, '批量更新完成')
  } catch (error: any) {
    console.error('批量更新卡密失败:', error)
    sendError(res, 'INTERNAL_ERROR', '批量更新卡密失败', null, 500)
  }
})

/**
 * DELETE /api/v1/cards/:id
 * 删除单个卡密
 */
router.delete('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.query('DELETE FROM cards WHERE id = ?', [id])
    sendSuccess(res, null, '卡密删除成功')
  } catch (error: any) {
    console.error('删除卡密失败:', error)
    sendError(res, 'INTERNAL_ERROR', '删除卡密失败', null, 500)
  }
})

/**
 * DELETE /api/v1/cards/batch
 * 批量删除卡密
 */
router.delete('/cards/batch', async (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids)) {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的ID数组', null, 400)
    }
    if (ids.length === 0) {
      return sendSuccess(res, { deleted: 0 }, '批量删除完成')
    }

    await db.query('DELETE FROM cards WHERE id IN (?)', [ids])
    sendSuccess(res, { deleted: ids.length }, '批量删除完成')
  } catch (error: any) {
    console.error('批量删除卡密失败:', error)
    sendError(res, 'INTERNAL_ERROR', '批量删除卡密失败', null, 500)
  }
})

export default router

