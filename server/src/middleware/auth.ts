import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../types/api.js'
import { findApiKeyByKey, updateApiKeyLastUsed } from '../utils/apiKey.js'
import { sendUnauthorized, sendForbidden } from '../utils/response.js'

/**
 * API Key认证中间件
 * 从请求头 X-API-Key 中获取API Key并验证
 */
export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string

    if (!apiKey) {
      sendUnauthorized(res, '缺少API Key，请在请求头中提供 X-API-Key')
      return
    }

    // 查找API Key记录
    const apiKeyRecord = await findApiKeyByKey(apiKey)

    if (!apiKeyRecord) {
      sendUnauthorized(res, '无效的API Key')
      return
    }

    // 检查API Key是否激活
    if (!apiKeyRecord.is_active) {
      sendForbidden(res, 'API Key已被禁用')
      return
    }

    // 更新最后使用时间（异步，不阻塞请求）
    updateApiKeyLastUsed(apiKeyRecord.id).catch(err => {
      console.error('更新API Key最后使用时间失败:', err)
    })

    // 将API Key信息附加到请求对象
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      platform: apiKeyRecord.platform,
      rate_limit_per_minute: apiKeyRecord.rate_limit_per_minute
    }

    next()
  } catch (error: any) {
    console.error('API Key认证失败:', error)
    sendUnauthorized(res, '认证失败')
  }
}

/**
 * 可选认证中间件（某些接口可能需要可选认证）
 */
export async function optionalAuthenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string

    if (apiKey) {
      const apiKeyRecord = await findApiKeyByKey(apiKey)

      if (apiKeyRecord && apiKeyRecord.is_active) {
        updateApiKeyLastUsed(apiKeyRecord.id).catch(err => {
          console.error('更新API Key最后使用时间失败:', err)
        })

        req.apiKey = {
          id: apiKeyRecord.id,
          name: apiKeyRecord.name,
          platform: apiKeyRecord.platform,
          rate_limit_per_minute: apiKeyRecord.rate_limit_per_minute
        }
      }
    }

    next()
  } catch (error: any) {
    // 可选认证失败不影响请求继续
    console.error('可选API Key认证失败:', error)
    next()
  }
}

