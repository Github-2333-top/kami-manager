#!/usr/bin/env tsx

/**
 * 创建API Key脚本
 * 用法: tsx scripts/create-api-key.ts <name> [platform] [rateLimit]
 */

import { createApiKey } from '../src/utils/apiKey.js'
import { initDatabase } from '../src/db.js'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('用法: tsx scripts/create-api-key.ts <name> [platform] [rateLimit]')
    console.error('示例: tsx scripts/create-api-key.ts "闲鱼取卡" "闲鱼" 100')
    process.exit(1)
  }

  const name = args[0]
  const platform = args[1] || null
  const rateLimit = args[2] ? parseInt(args[2]) : 100

  if (isNaN(rateLimit) || rateLimit <= 0) {
    console.error('错误: rateLimit 必须是正整数')
    process.exit(1)
  }

  try {
    // 初始化数据库连接
    await initDatabase()

    // 创建API Key
    const { id, apiKey } = await createApiKey(name, platform, rateLimit)

    console.log('\n✅ API Key 创建成功！\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('API Key ID:', id)
    console.log('名称:', name)
    console.log('平台:', platform || '未指定')
    console.log('限流:', `${rateLimit} 次/分钟`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  请妥善保管以下API Key，它只会显示一次：\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(apiKey)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n使用方式：')
    console.log('在请求头中添加: X-API-Key:', apiKey)
    console.log('\n')

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ 创建API Key失败:', error.message)
    process.exit(1)
  }
}

main()

