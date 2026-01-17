import mysql from 'mysql2/promise'
import type { Pool, PoolConnection } from 'mysql2/promise'

/**
 * 外部数据库连接服务
 * 用于连接 114.66.49.176 上的 weiyintkj 表
 */

// 外部MySQL连接配置
const externalDbConfig = {
  host: process.env.EXTERNAL_DB_HOST || '114.66.49.176',
  port: parseInt(process.env.EXTERNAL_DB_PORT || '3306'),
  user: process.env.EXTERNAL_DB_USER || 'weiyintkj',
  password: process.env.EXTERNAL_DB_PASSWORD || 'RWMMdzzdpfbxxMPw',
  database: process.env.EXTERNAL_DB_NAME || 'weiyintkj',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
}

// 外部数据库连接池（延迟初始化）
let externalDbPool: Pool | null = null

/**
 * 获取外部数据库连接池
 */
export function getExternalDbPool(): Pool {
  if (!externalDbPool) {
    externalDbPool = mysql.createPool(externalDbConfig)
    console.log('✓ 外部数据库连接池已创建 (114.66.49.176)')
  }
  return externalDbPool
}

/**
 * 测试外部数据库连接
 */
export async function testExternalDbConnection(): Promise<boolean> {
  try {
    const pool = getExternalDbPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✓ 外部数据库连接测试成功')
    return true
  } catch (error: any) {
    console.error('✗ 外部数据库连接测试失败:', error.message)
    return false
  }
}

/**
 * 卡密数据接口
 */
export interface CardKeyData {
  // 卡密字段
  km: string          // 卡密（key）
  point: number       // 积分，固定为0
  seconds: number     // 有效时长（秒），默认31536000（一年）
  add_time: number    // 添加时间戳，固定为1768205345
  status: number      // 状态，固定为0（未使用）
  from_soft_id: number // 来源软件ID，固定为1
  from_admin_id: number // 来源管理员ID，固定为1
}

/**
 * 批量写入卡密到外部数据库
 * @param keys 卡密数组
 * @returns 写入结果
 */
export async function writeKeysToExternalDb(keys: string[]): Promise<{
  success: boolean
  insertedCount: number
  duplicateCount: number
  errorMessage?: string
}> {
  if (keys.length === 0) {
    return { success: true, insertedCount: 0, duplicateCount: 0 }
  }

  const pool = getExternalDbPool()
  let connection: PoolConnection | null = null
  
  try {
    connection = await pool.getConnection()
    
    // 准备批量插入数据
    const cardData: CardKeyData[] = keys.map(km => ({
      km,
      point: 0,
      seconds: 31536000,      // 一年
      add_time: 1768205345,   // 固定时间戳
      status: 0,
      from_soft_id: 1,
      from_admin_id: 1
    }))

    // 使用INSERT IGNORE来跳过重复的卡密
    const insertQuery = `
      INSERT IGNORE INTO weiyintkj 
      (km, point, seconds, add_time, status, from_soft_id, from_admin_id) 
      VALUES ?
    `
    
    const values = cardData.map(card => [
      card.km,
      card.point,
      card.seconds,
      card.add_time,
      card.status,
      card.from_soft_id,
      card.from_admin_id
    ])

    // 分批插入，每批100条
    const batchSize = 100
    let totalInserted = 0
    
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize)
      const [result] = await connection.query(insertQuery, [batch]) as any
      totalInserted += result.affectedRows
    }

    const duplicateCount = keys.length - totalInserted
    
    return {
      success: true,
      insertedCount: totalInserted,
      duplicateCount
    }
    
  } catch (error: any) {
    console.error('写入外部数据库失败:', error.message)
    return {
      success: false,
      insertedCount: 0,
      duplicateCount: 0,
      errorMessage: error.message
    }
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/**
 * 检查卡密是否已存在
 * @param keys 卡密数组
 * @returns 已存在的卡密数组
 */
export async function checkExistingKeys(keys: string[]): Promise<string[]> {
  if (keys.length === 0) {
    return []
  }

  const pool = getExternalDbPool()
  
  try {
    const [rows] = await pool.query(
      'SELECT km FROM weiyintkj WHERE km IN (?)',
      [keys]
    ) as any

    return rows.map((row: any) => row.km)
  } catch (error: any) {
    console.error('检查卡密失败:', error.message)
    return []
  }
}

/**
 * 关闭外部数据库连接池
 */
export async function closeExternalDbPool(): Promise<void> {
  if (externalDbPool) {
    await externalDbPool.end()
    externalDbPool = null
    console.log('✓ 外部数据库连接池已关闭')
  }
}
