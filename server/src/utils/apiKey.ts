import { createHash, randomBytes, timingSafeEqual, randomUUID } from 'crypto'
import { db } from '../db.js'

/**
 * 生成API Key
 * @returns 生成的API Key字符串
 */
export function generateApiKey(): string {
  // 生成32字节的随机字符串，转换为base64url格式
  const bytes = randomBytes(32)
  return `kami_${bytes.toString('base64url')}`
}

/**
 * 计算API Key的哈希值
 * @param apiKey API Key字符串
 * @returns SHA-256哈希值
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * 验证API Key
 * @param apiKey 原始API Key
 * @param hash 存储的哈希值
 * @returns 是否匹配
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey)
  return timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  )
}

/**
 * 创建新的API Key记录
 * @param name API Key名称
 * @param platform 平台名称（可选）
 * @param rateLimitPerMinute 每分钟限流次数（默认100）
 * @returns 生成的API Key和记录ID
 */
export async function createApiKey(
  name: string,
  platform: string | null = null,
  rateLimitPerMinute: number = 100
): Promise<{ id: string; apiKey: string }> {
  const apiKey = generateApiKey()
  const keyHash = hashApiKey(apiKey)
  const id = randomUUID()
  
  await db.query(
    'INSERT INTO api_keys (id, key_hash, name, platform, rate_limit_per_minute) VALUES (?, ?, ?, ?, ?)',
    [id, keyHash, name, platform, rateLimitPerMinute]
  )
  
  return { id, apiKey }
}

/**
 * 根据API Key查找记录
 * @param apiKey API Key字符串
 * @returns API Key记录或null
 */
export async function findApiKeyByKey(apiKey: string): Promise<{
  id: string
  name: string
  platform: string | null
  is_active: boolean
  rate_limit_per_minute: number
} | null> {
  const keyHash = hashApiKey(apiKey)
  const [rows] = await db.query(
    'SELECT id, name, platform, is_active, rate_limit_per_minute FROM api_keys WHERE key_hash = ?',
    [keyHash]
  )
  
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0] as any
  }
  
  return null
}

/**
 * 更新API Key的最后使用时间
 * @param apiKeyId API Key ID
 */
export async function updateApiKeyLastUsed(apiKeyId: string): Promise<void> {
  await db.query(
    'UPDATE api_keys SET last_used_at = NOW() WHERE id = ?',
    [apiKeyId]
  )
}

