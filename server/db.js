import mysql from 'mysql2/promise'

// MySQL 连接配置 - 请根据你的实际情况修改
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',           // 你的 MySQL 用户名
  password: '',           // 你的 MySQL 密码
  database: 'kami_manager', // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// 创建连接池
const pool = mysql.createPool(config)

// 初始化数据库和表
export async function initDatabase() {
  // 先连接不指定数据库，创建数据库
  const initPool = mysql.createPool({
    ...config,
    database: undefined
  })
  
  try {
    const conn = await initPool.getConnection()
    
    // 创建数据库
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`✓ 数据库 "${config.database}" 已就绪`)
    
    conn.release()
    await initPool.end()
    
    // 使用目标数据库创建表
    const db = await pool.getConnection()
    
    // 创建分类表
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ 分类表已就绪')
    
    // 创建卡密表
    await db.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        category_id VARCHAR(36),
        remark TEXT,
        used_by VARCHAR(255),
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `)
    console.log('✓ 卡密表已就绪')
    
    // 创建设置表
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(36) PRIMARY KEY,
        announcement TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ 设置表已就绪')
    
    // 初始化默认设置
    const [settings] = await db.query('SELECT * FROM settings WHERE id = ?', ['main'])
    if (settings.length === 0) {
      await db.query(
        'INSERT INTO settings (id, announcement) VALUES (?, ?)',
        ['main', '欢迎使用卡密管家！点击此处编辑公告内容。']
      )
      console.log('✓ 默认设置已创建')
    }
    
    // 初始化默认分类
    const [categories] = await db.query('SELECT COUNT(*) as count FROM categories')
    if (categories[0].count === 0) {
      await db.query(`
        INSERT INTO categories (id, name, color) VALUES 
        (UUID(), 'VIP', '#f59e0b'),
        (UUID(), '普通', '#3b82f6'),
        (UUID(), '测试', '#10b981')
      `)
      console.log('✓ 默认分类已创建')
    }
    
    db.release()
    console.log('✓ 数据库初始化完成！\n')
    
  } catch (error) {
    console.error('数据库初始化失败:', error.message)
    throw error
  }
}

export { pool as db }

