import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../../db.js'
import type { AuthenticatedRequest } from '../../types/api.js'
import { sendSuccess, sendError, sendNotFound } from '../../utils/response.js'

const router = Router()

/**
 * POST /api/v1/webhooks
 * 注册Webhook回调
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.apiKey) {
      return sendError(res, 'UNAUTHORIZED', '需要API Key认证', null, 401)
    }

    const { callback_url, events, secret_token } = req.body

    if (!callback_url || typeof callback_url !== 'string') {
      return sendError(res, 'INVALID_PARAMETER', '请提供有效的callback_url', null, 400)
    }

    // 验证URL格式
    try {
      new URL(callback_url)
    } catch {
      return sendError(res, 'INVALID_PARAMETER', 'callback_url格式无效', null, 400)
    }

    const id = randomUUID()
    const eventsArray = Array.isArray(events) ? events : ['card.withdrawn']

    await db.query(
      `INSERT INTO webhook_subscriptions (id, api_key_id, callback_url, events, secret_token, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [
        id,
        req.apiKey.id,
        callback_url,
        JSON.stringify(eventsArray),
        secret_token || null
      ]
    )

    sendSuccess(
      res,
      {
        id,
        callback_url,
        events: eventsArray,
        is_active: true,
        created_at: new Date().toISOString()
      },
      'Webhook订阅创建成功',
      201
    )
  } catch (error: any) {
    console.error('创建Webhook订阅失败:', error)
    sendError(res, 'INTERNAL_ERROR', '创建Webhook订阅失败', null, 500)
  }
})

/**
 * GET /api/v1/webhooks
 * 查询Webhook订阅列表
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.apiKey) {
      return sendError(res, 'UNAUTHORIZED', '需要API Key认证', null, 401)
    }

    const [rows] = await db.query(
      `SELECT id, callback_url, events, is_active, created_at
       FROM webhook_subscriptions
       WHERE api_key_id = ?
       ORDER BY created_at DESC`,
      [req.apiKey.id]
    )

    const subscriptions = (rows as any[]).map(row => ({
      id: row.id,
      callback_url: row.callback_url,
      events: row.events ? JSON.parse(row.events) : [],
      is_active: row.is_active,
      created_at: row.created_at.toISOString()
    }))

    sendSuccess(res, subscriptions, '获取Webhook订阅列表成功')
  } catch (error: any) {
    console.error('获取Webhook订阅列表失败:', error)
    sendError(res, 'INTERNAL_ERROR', '获取Webhook订阅列表失败', null, 500)
  }
})

/**
 * DELETE /api/v1/webhooks/:id
 * 删除Webhook订阅
 */
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.apiKey) {
      return sendError(res, 'UNAUTHORIZED', '需要API Key认证', null, 401)
    }

    const { id } = req.params

    // 验证订阅是否属于当前API Key
    const [rows] = await db.query(
      'SELECT id FROM webhook_subscriptions WHERE id = ? AND api_key_id = ?',
      [id, req.apiKey.id]
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return sendNotFound(res, 'Webhook订阅不存在或无权限访问')
    }

    await db.query('DELETE FROM webhook_subscriptions WHERE id = ?', [id])

    sendSuccess(res, null, 'Webhook订阅删除成功')
  } catch (error: any) {
    console.error('删除Webhook订阅失败:', error)
    sendError(res, 'INTERNAL_ERROR', '删除Webhook订阅失败', null, 500)
  }
})

export default router

