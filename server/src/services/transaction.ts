import { randomUUID } from 'crypto'
import { db } from '../db.js'
import type { Transaction } from '../types/database.js'

/**
 * 创建事务记录
 */
export async function createTransaction(
  apiKeyId: string | null,
  categoryId: string | null,
  cardId: string | null,
  status: 'pending' | 'completed' | 'failed' = 'pending',
  errorMessage: string | null = null
): Promise<string> {
  const transactionId = randomUUID()
  const now = new Date()

  await db.query(
    `INSERT INTO transactions (id, api_key_id, category_id, card_id, status, error_message, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      apiKeyId,
      categoryId,
      cardId,
      status,
      errorMessage,
      now,
      status === 'completed' || status === 'failed' ? now : null
    ]
  )

  return transactionId
}

/**
 * 在事务中创建事务记录（用于嵌套事务）
 */
export async function createTransactionInConnection(
  connection: any,
  apiKeyId: string | null,
  categoryId: string | null,
  cardId: string | null,
  status: 'pending' | 'completed' | 'failed' = 'pending',
  errorMessage: string | null = null
): Promise<string> {
  const transactionId = randomUUID()
  const now = new Date()

  await connection.query(
    `INSERT INTO transactions (id, api_key_id, category_id, card_id, status, error_message, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      apiKeyId,
      categoryId,
      cardId,
      status,
      errorMessage,
      now,
      status === 'completed' || status === 'failed' ? now : null
    ]
  )

  return transactionId
}

/**
 * 更新事务状态
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed',
  errorMessage: string | null = null
): Promise<void> {
  const now = new Date()

  await db.query(
    `UPDATE transactions 
     SET status = ?, error_message = ?, completed_at = ?
     WHERE id = ?`,
    [status, errorMessage, now, transactionId]
  )
}

/**
 * 获取事务信息
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const [rows] = await db.query(
    'SELECT * FROM transactions WHERE id = ?',
    [transactionId]
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0] as Transaction
  }

  return null
}

