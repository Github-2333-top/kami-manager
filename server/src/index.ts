import express from 'express'
import cors from 'cors'
import { initDatabase } from './db.js'
import v1Router from './routes/v1/index.js'

const app = express()
const PORT = process.env.PORT || 14124

// 中间件
app.use(cors())
app.use(express.json())

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// 注册v1 API路由
app.use('/api/v1', v1Router)

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在'
    }
  })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('未处理的错误:', err)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  })
})

// 启动服务器
async function start() {
  try {
    console.log('正在连接 MySQL 数据库...\n')
    await initDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 后端服务已启动: http://localhost:${PORT}`)
      console.log(`📡 API 地址: http://localhost:${PORT}/api/v1`)
      console.log(`\n注意: 旧API (/api/*) 已完全移除，请使用新API (/api/v1/*)\n`)
    })
  } catch (error: any) {
    console.error('\n❌ 启动失败:', error.message)
    console.log('\n请检查:')
    console.log('1. MySQL 服务是否已启动')
    console.log('2. 数据库连接配置是否正确')
    process.exit(1)
  }
}

start()

