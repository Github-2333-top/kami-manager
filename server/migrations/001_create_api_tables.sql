-- API相关表结构迁移脚本
-- 此脚本会在initDatabase()中自动执行

-- 创建API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  platform VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit_per_minute INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  INDEX idx_key_hash (key_hash),
  INDEX idx_is_active (is_active)
);

-- 创建事务表
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  api_key_id VARCHAR(36),
  category_id VARCHAR(36),
  card_id VARCHAR(36),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_api_key (api_key_id),
  INDEX idx_created_at (created_at)
);

-- 创建Webhook订阅表
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  api_key_id VARCHAR(36) NOT NULL,
  callback_url VARCHAR(500) NOT NULL,
  events JSON,
  is_active BOOLEAN DEFAULT TRUE,
  secret_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  INDEX idx_api_key (api_key_id),
  INDEX idx_is_active (is_active)
);

-- 创建Webhook发送记录表
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR(36) PRIMARY KEY,
  subscription_id VARCHAR(36) NOT NULL,
  transaction_id VARCHAR(36),
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  response_code INT,
  response_body TEXT,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_subscription (subscription_id)
);

-- 为cards表添加索引（如果不存在）
-- 注意：MySQL不支持IF NOT EXISTS for indexes，需要手动检查
-- 这里在db.ts中已经添加了索引定义

