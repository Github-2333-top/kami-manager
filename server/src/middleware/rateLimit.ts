import rateLimit from 'express-rate-limit'
import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../types/api.js'

// 默认限流配置：每分钟100次请求
const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 限制每个IP每分钟100次请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * 创建基于API Key的限流中间件
 * 根据API Key的rate_limit_per_minute配置进行限流
 */
export function createApiKeyRateLimiter() {
  // 使用Map存储每个API Key的限流器
  const limiters = new Map<string, ReturnType<typeof rateLimit>>()

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // 如果请求已通过认证，使用API Key的限流配置
      if (req.apiKey) {
        const apiKeyId = req.apiKey.id
        const limitPerMinute = req.apiKey.rate_limit_per_minute

        // 获取或创建该API Key的限流器
        if (!limiters.has(apiKeyId)) {
          limiters.set(
            apiKeyId,
            rateLimit({
              windowMs: 60 * 1000,
              max: limitPerMinute,
              keyGenerator: () => apiKeyId, // 使用API Key ID作为key
              message: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: `API Key请求过于频繁，限制为每分钟${limitPerMinute}次`
                }
              },
              standardHeaders: true,
              legacyHeaders: false
            })
          )
        }

        const limiter = limiters.get(apiKeyId)!
        return limiter(req, res, next)
      }

      // 如果没有API Key，使用默认限流
      return defaultLimiter(req, res, next)
    } catch (error: any) {
      console.error('限流中间件错误:', error)
      next()
    }
  }
}

// 导出默认限流器
export { defaultLimiter }

