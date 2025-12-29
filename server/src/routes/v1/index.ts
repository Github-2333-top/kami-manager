import { Router } from 'express'
import cardsRouter from './cards.js'
import webhooksRouter from './webhooks.js'
import adminRouter from './admin.js'
import { authenticateApiKey, optionalAuthenticateApiKey } from '../../middleware/auth.js'
import { createApiKeyRateLimiter } from '../../middleware/rateLimit.js'
import { circuitBreakerMiddleware } from '../../middleware/circuitBreaker.js'

const router = Router()

// 应用熔断器中间件
router.use(circuitBreakerMiddleware)

// 应用限流中间件
const rateLimiter = createApiKeyRateLimiter()
router.use(rateLimiter as any)

// 卡片相关接口（取卡操作在cards.ts中单独处理认证）
router.use('/cards', optionalAuthenticateApiKey, cardsRouter)

// Webhook管理接口需要认证
router.use('/webhooks', authenticateApiKey, webhooksRouter)

// 管理接口（可选认证）
router.use('/', optionalAuthenticateApiKey, adminRouter)

export default router

