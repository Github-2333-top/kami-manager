import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../../db.js'
import type { AuthenticatedRequest } from '../../types/api.js'
import { sendSuccess, sendError, sendNotFound } from '../../utils/response.js'
import { getTransaction } from '../../services/transaction.js'
import { triggerWithdrawWebhook } from '../../services/webhook.js'

const router = Router()

/**
 * GET /api/v1/cards/categories
 * 获取所有可用分类列表
 */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, color FROM categories ORDER BY created_at'
    )

    sendSuccess(res, rows, '获取分类列表成功')
  } catch (error: any) {
    console.error('获取分类列表失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取分类列表失败', null, 500)
  }
})

/**
 * GET /api/v1/cards?category_id={category_id}
 * 根据分类ID获取可用卡片列表（仅返回未使用的卡片）
 */
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 0
    const offset = (page - 1) * limit

    let query = `
      SELECT id, code, category_id as categoryId, remark, used_by as usedBy, 
             is_used as isUsed, created_at as createdAt, updated_at as updatedAt 
      FROM cards 
      WHERE is_used = false
    `

    const params: any[] = []

    if (categoryId) {
      query += ' AND category_id = ?'
      params.push(categoryId)
    }

    query += ' ORDER BY created_at DESC'

    if (limit > 0) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }

    const [rows] = await db.query(query, params)

    if (limit > 0) {
      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM cards WHERE is_used = false'
      const countParams: any[] = []
      if (categoryId) {
        countQuery += ' AND category_id = ?'
        countParams.push(categoryId)
      }
      const [[{ total }]] = await db.query(countQuery, countParams) as any

      sendSuccess(res, {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, '获取卡片列表成功')
    } else {
      sendSuccess(res, rows, '获取卡片列表成功')
    }
  } catch (error: any) {
    console.error('获取卡片列表失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取卡片列表失败', null, 500)
  }
})

/**
 * POST /api/v1/cards/withdraw
 * 执行取卡操作（核心接口）
 * 从指定分类随机选择一张未使用的卡密，取卡后标记为已使用
 */
router.post('/withdraw', async (req: AuthenticatedRequest, res) => {
  // 检查API Key认证
  if (!req.apiKey) {
    return sendError(res, 'UNAUTHORIZED', '取卡操作需要API Key认证', null, 401)
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { category_id } = req.body

    // 验证请求参数
    if (!category_id || typeof category_id !== 'string') {
      await connection.rollback()
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的分类ID', null, 400)
    }

    // 验证分类是否存在
    const [categories] = await connection.query(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    )

    if (!Array.isArray(categories) || categories.length === 0) {
      await connection.rollback()
      return sendNotFound(res, '指定的分类不存在')
    }

    // 查询该分类下所有未使用的卡密，随机选择一张并锁定
    // 使用ORDER BY RAND()和FOR UPDATE确保原子性
    const [cards] = await connection.query(
      `SELECT id, code FROM cards 
       WHERE category_id = ? AND is_used = false 
       ORDER BY RAND() 
       LIMIT 1 
       FOR UPDATE`,
      [category_id]
    ) as any[]

    if (!Array.isArray(cards) || cards.length === 0) {
      await connection.rollback()
      return sendError(
        res,
        'NO_AVAILABLE_CARDS',
        '该分类下没有可用的卡密',
        { category_id },
        404
      )
    }

    const card = cards[0]

    // 更新卡密状态为已使用
    await connection.query(
      'UPDATE cards SET is_used = true, updated_at = NOW() WHERE id = ?',
      [card.id]
    )

    // 创建事务记录（在同一个连接中）
    const transactionId = randomUUID()
    const now = new Date()
    await connection.query(
      `INSERT INTO transactions (id, api_key_id, category_id, card_id, status, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        req.apiKey?.id || null,
        category_id,
        card.id,
        'completed',
        now,
        now
      ]
    )

    // 提交事务
    await connection.commit()

    // 触发Webhook（异步，不阻塞响应）
    if (req.apiKey?.id) {
      triggerWithdrawWebhook(req.apiKey.id, transactionId, card.id, card.code).catch(
        err => console.error('Webhook触发失败:', err)
      )
    }

    // 返回响应（注意字段名为cardsID）
    sendSuccess(
      res,
      {
        transaction_id: transactionId,
        cardsID: card.id, // 注意：字段名为cardsID
        code: card.code,
        status: 'completed' as const
      },
      '取卡成功',
      201
    )
  } catch (error: any) {
    await connection.rollback()
    console.error('取卡操作失败:', error)
    sendError(res, 'INTERNAL_ERROR', '取卡操作失败', { error: error.message }, 500)
  } finally {
    connection.release()
  }
})

/**
 * GET /api/v1/cards/sync-status?transaction_id={transaction_id}
 * 查询取卡操作状态（支持长轮询）
 */
router.get('/sync-status', async (req, res) => {
  try {
    const transactionId = req.query.transaction_id as string
    const longPoll = req.query.long_poll === 'true' || req.query.long_poll === '1'
    const maxWaitTime = 30000 // 最长等待30秒
    const checkInterval = 5000 // 每5秒检查一次

    if (!transactionId) {
      return sendError(res, 'INVALID_PARAMETER', '请提供transaction_id参数', null, 400)
    }

    // 立即查询一次
    let transaction = await getTransaction(transactionId)

    if (!transaction) {
      return sendNotFound(res, '事务不存在')
    }

    // 如果状态已完成或失败，直接返回
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      return sendSuccess(res, {
        transaction_id: transaction.id,
        status: transaction.status,
        card_id: transaction.card_id,
        error_message: transaction.error_message,
        created_at: transaction.created_at.toISOString(),
        completed_at: transaction.completed_at?.toISOString() || null
      }, '查询成功')
    }

    // 如果启用长轮询且状态为pending
    if (longPoll && transaction.status === 'pending') {
      const startTime = Date.now()

      // 长轮询：每5秒检查一次，最多等待30秒
      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval))

        const updatedTransaction = await getTransaction(transactionId)

        // 如果事务不存在，返回错误
        if (!updatedTransaction) {
          return sendNotFound(res, '事务不存在')
        }

        // 如果状态已完成或失败，立即返回
        if (updatedTransaction.status === 'completed' || updatedTransaction.status === 'failed') {
          return sendSuccess(res, {
            transaction_id: updatedTransaction.id,
            status: updatedTransaction.status,
            card_id: updatedTransaction.card_id,
            error_message: updatedTransaction.error_message,
            created_at: updatedTransaction.created_at.toISOString(),
            completed_at: updatedTransaction.completed_at?.toISOString() || null
          }, '查询成功')
        }

        // 更新transaction引用
        transaction = updatedTransaction
      }

      // 超时后返回当前状态（此时transaction肯定不为null）
      return sendSuccess(res, {
        transaction_id: transaction.id,
        status: transaction.status,
        card_id: transaction.card_id,
        error_message: transaction.error_message,
        created_at: transaction.created_at.toISOString(),
        completed_at: transaction.completed_at?.toISOString() || null
      }, '查询成功（超时）')
    }

    // 普通查询返回当前状态（此时transaction肯定不为null，因为前面已经检查过）
    sendSuccess(res, {
      transaction_id: transaction.id,
      status: transaction.status,
      card_id: transaction.card_id,
      error_message: transaction.error_message,
      created_at: transaction.created_at.toISOString(),
      completed_at: transaction.completed_at?.toISOString() || null
    }, '查询成功')
  } catch (error: any) {
    console.error('查询同步状态失败:', error)
    sendError(res, 'INTERNAL_ERROR', '查询同步状态失败', null, 500)
  }
})

export default router

