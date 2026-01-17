import { Router, Request, Response } from 'express'
import { writeKeysToExternalDb, testExternalDbConnection, checkExistingKeys } from '../../services/externalDb.js'

const router = Router()

/**
 * 生成随机字符（小写字母a-z + 数字0-9）
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成卡密
 * POST /api/v1/generate/keys
 * Body: { count: number, prefix: string }
 */
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const { count = 100, prefix = 'weiyi' } = req.body

    // 参数验证
    if (typeof count !== 'number' || count < 1 || count > 1000) {
      return res.status(400).json({
        success: false,
        error: '生成数量必须在1-1000之间'
      })
    }

    if (typeof prefix !== 'string' || prefix.length > 50) {
      return res.status(400).json({
        success: false,
        error: '前缀长度不能超过50个字符'
      })
    }

    // 生成卡密
    const keys: string[] = []
    const usedKeys = new Set<string>()

    for (let i = 0; i < count; i++) {
      let key: string
      // 确保生成的卡密不重复
      do {
        const randomPart = generateRandomString(32)
        key = `${prefix}${randomPart}`
      } while (usedKeys.has(key))
      
      usedKeys.add(key)
      keys.push(key)
    }

    res.json({
      success: true,
      data: {
        count: keys.length,
        prefix,
        keys,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('生成卡密失败:', error.message)
    res.status(500).json({
      success: false,
      error: '生成卡密失败: ' + error.message
    })
  }
})

/**
 * 写入卡密到外部数据库
 * POST /api/v1/generate/write
 * Body: { keys: string[] }
 */
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body

    // 参数验证
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要写入的卡密数组'
      })
    }

    if (keys.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '单次写入不能超过1000条'
      })
    }

    // 验证每个卡密是字符串
    for (const key of keys) {
      if (typeof key !== 'string' || key.length === 0 || key.length > 255) {
        return res.status(400).json({
          success: false,
          error: '卡密格式不正确'
        })
      }
    }

    // 写入外部数据库
    const result = await writeKeysToExternalDb(keys)

    if (result.success) {
      res.json({
        success: true,
        data: {
          totalCount: keys.length,
          insertedCount: result.insertedCount,
          duplicateCount: result.duplicateCount,
          writtenAt: new Date().toISOString()
        }
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.errorMessage || '写入数据库失败'
      })
    }

  } catch (error: any) {
    console.error('写入数据库失败:', error.message)
    res.status(500).json({
      success: false,
      error: '写入数据库失败: ' + error.message
    })
  }
})

/**
 * 检查数据库连接状态
 * GET /api/v1/generate/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const connected = await testExternalDbConnection()
    
    res.json({
      success: true,
      data: {
        externalDbConnected: connected,
        checkedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: '检查连接失败: ' + error.message
    })
  }
})

/**
 * 检查卡密是否已存在
 * POST /api/v1/generate/check
 * Body: { keys: string[] }
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要检查的卡密数组'
      })
    }

    const existingKeys = await checkExistingKeys(keys)
    
    res.json({
      success: true,
      data: {
        totalChecked: keys.length,
        existingCount: existingKeys.length,
        existingKeys
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: '检查卡密失败: ' + error.message
    })
  }
})

export default router
