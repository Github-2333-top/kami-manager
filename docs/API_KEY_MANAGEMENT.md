# API Key 管理指南

## 创建 API Key

### 方法一：使用脚本命令（推荐）

```bash
cd server
npm run create-api-key <名称> [平台] [限流次数]
```

**示例：**

```bash
# 创建闲鱼取卡API Key，限流100次/分钟
npm run create-api-key "闲鱼取卡" "闲鱼" 100

# 创建其他平台API Key
npm run create-api-key "测试平台" "测试" 200
```

### 方法二：直接运行脚本

```bash
cd server
npx tsx scripts/create-api-key.ts "闲鱼取卡" "闲鱼" 100
```

## 参数说明

- **名称** (必填): API Key 的名称，用于标识用途
- **平台** (可选): 平台名称，如"闲鱼"、"淘宝"等
- **限流次数** (可选): 每分钟允许的请求次数，默认100次/分钟

## 已创建的 API Key

### 闲鱼取卡

- **API Key**: `kami_Pfcl0MeUB9Y6BZe8P3ypuFT0thLmKMSm2fuiINJgbhs`
- **名称**: 闲鱼取卡
- **平台**: 闲鱼
- **限流**: 100 次/分钟
- **创建时间**: 2024-01-01

⚠️ **重要提示**: API Key 只会显示一次，请妥善保管！

## 使用方式

在 HTTP 请求头中添加：

```
X-API-Key: kami_Pfcl0MeUB9Y6BZe8P3ypuFT0thLmKMSm2fuiINJgbhs
```

### 示例

```bash
# 取卡操作
curl -X POST http://localhost:14124/api/v1/cards/withdraw \
  -H "X-API-Key: kami_Pfcl0MeUB9Y6BZe8P3ypuFT0thLmKMSm2fuiINJgbhs" \
  -H "Content-Type: application/json" \
  -d '{"category_id": "your-category-id"}'
```

## 查看所有 API Key

可以通过数据库查询查看所有已创建的 API Key：

```sql
SELECT id, name, platform, is_active, rate_limit_per_minute, created_at, last_used_at
FROM api_keys
ORDER BY created_at DESC;
```

## 禁用/启用 API Key

```sql
-- 禁用 API Key
UPDATE api_keys SET is_active = FALSE WHERE id = 'your-api-key-id';

-- 启用 API Key
UPDATE api_keys SET is_active = TRUE WHERE id = 'your-api-key-id';
```

## 删除 API Key

```sql
DELETE FROM api_keys WHERE id = 'your-api-key-id';
```

## 安全建议

1. **妥善保管**: API Key 相当于密码，请妥善保管，不要泄露
2. **定期轮换**: 建议定期更换 API Key，提高安全性
3. **限制权限**: 为不同平台创建不同的 API Key，便于管理和监控
4. **监控使用**: 定期检查 `last_used_at` 字段，发现异常及时处理
5. **生产环境**: 生产环境必须使用 HTTPS，确保 API Key 传输安全

