import { randomUUID, createHmac } from 'crypto'
import { db } from '../db.js'
import type { WebhookSubscription } from '../types/database.js'

/**
 * 获取活跃的Webhook订阅
 */
export async function getActiveWebhooks(apiKeyId: string): Promise<WebhookSubscription[]> {
  const [rows] = await db.query(
    `SELECT * FROM webhook_subscriptions 
     WHERE api_key_id = ? AND is_active = TRUE`,
    [apiKeyId]
  )

  return (rows as any[]) || []
}

/**
 * 发送Webhook通知
 */
export async function sendWebhook(
  subscription: WebhookSubscription,
  event: string,
  data: any
): Promise<void> {
  const deliveryId = randomUUID()

  try {
    // 创建Webhook发送记录
    await db.query(
      `INSERT INTO webhook_deliveries (id, subscription_id, status, attempts, created_at)
       VALUES (?, ?, 'pending', 0, NOW())`,
      [deliveryId, subscription.id]
    )

    // 构建Webhook payload
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString()
    }

    // 如果有secret_token，生成HMAC签名
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'KamiManager-Webhook/1.0'
    }

    if (subscription.secret_token) {
      const signature = createHmac('sha256', subscription.secret_token)
        .update(JSON.stringify(payload))
        .digest('hex')
      headers['X-Webhook-Signature'] = `sha256=${signature}`
    }

    // 发送HTTP请求
    const response = await fetch(subscription.callback_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    const responseBody = await response.text().catch(() => '')

    // 更新发送记录
    await db.query(
      `UPDATE webhook_deliveries 
       SET status = ?, response_code = ?, response_body = ?, delivered_at = NOW()
       WHERE id = ?`,
      [
        response.ok ? 'success' : 'failed',
        response.status,
        responseBody.substring(0, 1000), // 限制响应体长度
        deliveryId
      ]
    )

    if (!response.ok) {
      throw new Error(`Webhook发送失败: ${response.status} ${response.statusText}`)
    }
  } catch (error: any) {
    // 更新发送记录为失败
    await db.query(
      `UPDATE webhook_deliveries 
       SET status = 'failed', attempts = attempts + 1
       WHERE id = ?`,
      [deliveryId]
    )

    // 如果失败次数少于3次，可以稍后重试
    console.error(`Webhook发送失败 (${subscription.callback_url}):`, error.message)
    throw error
  }
}

/**
 * 触发取卡操作的Webhook通知
 */
export async function triggerWithdrawWebhook(
  apiKeyId: string,
  transactionId: string,
  cardId: string,
  cardCode: string
): Promise<void> {
  try {
    const subscriptions = await getActiveWebhooks(apiKeyId)

    // 并行发送所有Webhook（不等待结果）
    const promises = subscriptions.map(subscription =>
      sendWebhook(subscription, 'card.withdrawn', {
        transaction_id: transactionId,
        card_id: cardId,
        card_code: cardCode
      }).catch(err => {
        console.error(`Webhook发送失败 (${subscription.callback_url}):`, err)
      })
    )

    // 不等待所有Webhook完成，避免阻塞响应
    Promise.all(promises).catch(err => {
      console.error('Webhook批量发送错误:', err)
    })
  } catch (error: any) {
    console.error('触发Webhook失败:', error)
    // Webhook失败不影响主流程
  }
}

