# Kami Manager RESTful API v1 文档

## 概述

本文档描述了 Kami Manager 系统的 RESTful API v1 版本。所有 API 遵循 REST 设计原则，使用 JSON 格式进行数据交换。

### 基础路径

```
/kami_manager/api/v1
```

说明：服务同时兼容 `/api/v1`（旧路径），但推荐统一使用 `/kami_manager/api/v1`（与前端部署子路径一致）。

### 认证方式

所有需要认证的接口都需要在请求头中提供 API Key：

```
X-API-Key: your-api-key-here
```

### 通用响应格式

#### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### HTTP 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（缺少或无效的API Key） |
| 403 | 禁止访问（API Key被禁用） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（触发限流） |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用（熔断器打开） |

---

## 1. 健康检查

### GET /api/v1/health

检查服务健康状态。

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/health
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "connected"
  },
  "message": "服务正常"
}
```

---

## 2. 统计数据

### GET /api/v1/stats

获取系统统计数据。

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/stats
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "total": 1000,
    "usedCount": 500,
    "unusedCount": 500,
    "uncategorizedCount": 50,
    "categoryStats": [
      {
        "id": "xxx",
        "name": "VIP",
        "color": "#f59e0b",
        "count": 300
      }
    ]
  },
  "message": "获取统计数据成功"
}
```

---

## 3. 分类管理

### GET /api/v1/categories

获取所有分类列表。

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/categories
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "VIP",
      "color": "#f59e0b"
    }
  ],
  "message": "获取分类列表成功"
}
```

### POST /api/v1/categories

添加新分类。

**请求体：**

```json
{
  "name": "新分类",
  "color": "#ff0000"
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "name": "新分类",
    "color": "#ff0000"
  },
  "message": "分类添加成功"
}
```

### PUT /api/v1/categories/:id

更新分类。

**请求体：**

```json
{
  "name": "更新后的名称",
  "color": "#00ff00"
}
```

**请求示例：**

```bash
curl -X PUT http://localhost:14124/api/v1/categories/xxx \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的名称",
    "color": "#00ff00"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "分类更新成功"
}
```

**参数说明：**

- `name` 和 `color` 都是可选参数，至少需要提供一个
- `name` 不能为空，且长度不能超过50个字符
- `color` 必须是有效的十六进制颜色值（如 #ff0000）

### DELETE /api/v1/categories/:id

删除分类。删除分类后，该分类下的所有卡密将自动取消分类（category_id 设置为 NULL）。

**请求示例：**

```bash
curl -X DELETE http://localhost:14124/api/v1/categories/xxx
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "分类删除成功"
}
```

---

## 4. 卡片查询

### GET /api/v1/cards/categories

获取所有可用分类列表（用于取卡操作）。

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/cards/categories \
  -H "X-API-Key: your-api-key"
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "VIP",
      "color": "#f59e0b"
    }
  ],
  "message": "获取分类列表成功"
}
```

### GET /api/v1/cards?category_id={category_id}

根据分类ID获取可用卡片列表（**仅返回未使用的卡片**，即 `isUsed = false`）。

**查询参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| category_id | String | 否 | 分类ID（不提供则返回所有分类的未使用卡片） |
| page | Number | 否 | 页码（默认1） |
| limit | Number | 否 | 每页数量（默认0，表示不分页） |

**请求示例：**

```bash
curl -X GET "http://localhost:14124/api/v1/cards?category_id=xxx&page=1&limit=20" \
  -H "X-API-Key: your-api-key"
```

**响应示例（分页）：**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "xxx",
        "code": "CARD-CODE-123",
        "categoryId": "xxx",
        "remark": "",
        "usedBy": null,
        "isUsed": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "message": "获取卡片列表成功"
}
```

**响应示例（不分页，limit=0）：**

```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "code": "CARD-CODE-123",
      "categoryId": "xxx",
      "remark": "",
      "usedBy": null,
      "isUsed": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取卡片列表成功"
}
```

**重要说明：**

- 此接口**仅返回未使用的卡片**（`isUsed = false`）
- 如需获取所有卡片（包括已使用的），请使用"8. 卡密管理"中的 `GET /api/v1/cards` 接口

---

## 5. 取卡操作（核心接口）

### POST /api/v1/cards/withdraw

执行取卡操作。从指定分类随机选择一张未使用的卡密，取卡后自动标记为已使用。

**认证：** 需要 API Key

**请求体：**

```json
{
  "category_id": "xxx"
}
```

**请求示例：**

```bash
curl -X POST http://localhost:14124/api/v1/cards/withdraw \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "xxx"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "transaction_id": "transaction-uuid",
    "cardsID": "card-uuid-here",
    "code": "CARD-CODE-123",
    "status": "completed"
  },
  "message": "取卡成功"
}
```

**重要说明：**

- 一次请求仅取一张卡密
- 从指定分类的所有未使用卡密中随机选择一张
- 取卡成功后自动将卡密标记为已使用（is_used = true）
- **响应字段 `cardsID` 包含取出的卡密ID**（注意大小写）
- 使用数据库事务确保操作的原子性
- 如果分类下没有可用的卡密，返回404错误

**错误响应：**

```json
{
  "success": false,
  "error": {
    "code": "NO_AVAILABLE_CARDS",
    "message": "该分类下没有可用的卡密",
    "details": {
      "category_id": "xxx"
    }
  }
}
```

---

## 6. 同步状态查询

### GET /api/v1/cards/sync-status?transaction_id={transaction_id}

查询取卡操作状态。支持长轮询。

**查询参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| transaction_id | String | 是 | 事务ID |
| long_poll | Boolean | 否 | 是否启用长轮询（默认false） |

**请求示例：**

```bash
# 普通查询
curl -X GET "http://localhost:14124/api/v1/cards/sync-status?transaction_id=xxx" \
  -H "X-API-Key: your-api-key"

# 长轮询查询
curl -X GET "http://localhost:14124/api/v1/cards/sync-status?transaction_id=xxx&long_poll=true" \
  -H "X-API-Key: your-api-key"
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "transaction_id": "xxx",
    "status": "completed",
    "card_id": "card-uuid",
    "error_message": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "completed_at": "2024-01-01T00:00:01.000Z"
  },
  "message": "查询成功"
}
```

**长轮询说明：**

- 如果状态为 `pending`，服务器会保持连接最多30秒
- 每5秒检查一次状态，一旦状态变为 `completed` 或 `failed` 立即返回
- 超时后返回当前状态，客户端可继续轮询

---

## 7. Webhook管理

### POST /api/v1/webhooks

注册Webhook回调。

**认证：** 需要 API Key

**请求体：**

```json
{
  "callback_url": "https://your-platform.com/webhook",
  "events": ["card.withdrawn"],
  "secret_token": "your-secret-token"
}
```

**请求示例：**

```bash
curl -X POST http://localhost:14124/api/v1/webhooks \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_url": "https://your-platform.com/webhook",
    "events": ["card.withdrawn"],
    "secret_token": "your-secret-token"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "callback_url": "https://your-platform.com/webhook",
    "events": ["card.withdrawn"],
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Webhook订阅创建成功"
}
```

### GET /api/v1/webhooks

查询Webhook订阅列表。返回当前API Key下的所有Webhook订阅。

**认证：** 需要 API Key

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/webhooks \
  -H "X-API-Key: your-api-key"
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "webhook-uuid",
      "callback_url": "https://your-platform.com/webhook",
      "events": ["card.withdrawn"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取Webhook订阅列表成功"
}
```

### DELETE /api/v1/webhooks/:id

删除Webhook订阅。只能删除属于当前API Key的订阅。

**认证：** 需要 API Key

**请求示例：**

```bash
curl -X DELETE http://localhost:14124/api/v1/webhooks/webhook-uuid \
  -H "X-API-Key: your-api-key"
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "Webhook订阅删除成功"
}
```

---

## 8. 卡密管理

### GET /api/v1/cards

获取所有卡密（**包括已使用和未使用的**，支持分页）。

**重要说明：** 此接口与"4. 卡片查询"中的 `GET /api/v1/cards` 不同：
- 此接口返回**所有卡密**（包括已使用的）
- "4. 卡片查询"中的接口仅返回**未使用的卡密**

**查询参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | Number | 否 | 页码（默认1） |
| limit | Number | 否 | 每页数量（默认0，表示不分页） |

**请求示例：**

```bash
curl -X GET "http://localhost:14124/api/v1/cards?page=1&limit=20"
```

**响应示例（分页）：**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "xxx",
        "code": "CARD-CODE-123",
        "categoryId": "xxx",
        "remark": "备注",
        "usedBy": "使用者",
        "isUsed": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000,
      "totalPages": 50
    }
  },
  "message": "获取卡密列表成功"
}
```

**响应示例（不分页）：**

```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "code": "CARD-CODE-123",
      "categoryId": "xxx",
      "remark": "备注",
      "usedBy": "使用者",
      "isUsed": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取卡密列表成功"
}
```

### POST /api/v1/cards/batch

批量添加卡密。重复的卡密代码会被自动跳过。

**请求体：**

```json
{
  "codes": ["CARD-001", "CARD-002", "CARD-003"],
  "categoryId": "xxx"
}
```

**请求示例：**

```bash
curl -X POST http://localhost:14124/api/v1/cards/batch \
  -H "Content-Type: application/json" \
  -d '{
    "codes": ["CARD-001", "CARD-002"],
    "categoryId": "xxx"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "added": 2,
    "duplicates": 0
  },
  "message": "批量添加完成"
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| codes | Array<String> | 是 | 卡密代码数组 |
| categoryId | String | 否 | 分类ID（可选，不提供则为未分类） |

### PUT /api/v1/cards/:id

更新单个卡密。

**请求体：**

```json
{
  "categoryId": "xxx",
  "remark": "备注",
  "usedBy": "使用者",
  "isUsed": true
}
```

**请求示例：**

```bash
curl -X PUT http://localhost:14124/api/v1/cards/xxx \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "xxx",
    "remark": "备注",
    "usedBy": "使用者",
    "isUsed": true
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "卡密更新成功"
}
```

**参数说明：**

所有参数都是可选的，至少需要提供一个：
- `categoryId`: 分类ID（设置为 `null` 可取消分类）
- `remark`: 备注信息
- `usedBy`: 使用者
- `isUsed`: 是否已使用（布尔值）

### PUT /api/v1/cards/batch

批量更新卡密。

**请求体：**

```json
{
  "ids": ["id1", "id2"],
  "updates": {
    "categoryId": "xxx",
    "isUsed": true
  }
}
```

**请求示例：**

```bash
curl -X PUT http://localhost:14124/api/v1/cards/batch \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2"],
    "updates": {
      "categoryId": "xxx",
      "isUsed": true
    }
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "updated": 2
  },
  "message": "批量更新完成"
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| ids | Array<String> | 是 | 要更新的卡密ID数组 |
| updates | Object | 是 | 更新字段对象（至少包含一个字段） |

### DELETE /api/v1/cards/:id

删除单个卡密。

**请求示例：**

```bash
curl -X DELETE http://localhost:14124/api/v1/cards/xxx
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "卡密删除成功"
}
```

### DELETE /api/v1/cards/batch

批量删除卡密。

**请求体：**

```json
{
  "ids": ["id1", "id2"]
}
```

**请求示例：**

```bash
curl -X DELETE http://localhost:14124/api/v1/cards/batch \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2"]
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "deleted": 2
  },
  "message": "批量删除完成"
}
```

---

## 9. 设置管理

### GET /api/v1/settings

获取系统设置。

**请求示例：**

```bash
curl -X GET http://localhost:14124/api/v1/settings
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "main",
    "announcement": "系统公告内容"
  },
  "message": "获取设置成功"
}
```

### PUT /api/v1/settings/announcement

更新系统公告。

**请求体：**

```json
{
  "announcement": "公告内容"
}
```

**请求示例：**

```bash
curl -X PUT http://localhost:14124/api/v1/settings/announcement \
  -H "Content-Type: application/json" \
  -d '{
    "announcement": "公告内容"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": null,
  "message": "公告更新成功"
}
```

**参数说明：**

- `announcement`: 公告内容（字符串，最大长度1000个字符）

---

## 错误代码说明

| 错误代码 | HTTP状态码 | 描述 |
|----------|-----------|------|
| INVALID_PARAMETER | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权（缺少或无效的API Key） |
| FORBIDDEN | 403 | 禁止访问（API Key被禁用） |
| NOT_FOUND | 404 | 资源不存在 |
| NO_AVAILABLE_CARDS | 404 | 该分类下没有可用的卡密 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| CIRCUIT_BREAKER_OPEN | 503 | 服务暂时不可用 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## SDK示例代码

### Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:14124/kami_manager/api/v1';
const API_KEY = 'your-api-key';

// 取卡操作
async function withdrawCard(categoryId) {
  try {
    const response = await axios.post(
      `${API_BASE}/cards/withdraw`,
      { category_id: categoryId },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('取卡成功:', response.data.data);
    console.log('卡密ID:', response.data.data.cardsID);
    console.log('卡密代码:', response.data.data.code);
    
    return response.data.data;
  } catch (error) {
    console.error('取卡失败:', error.response?.data || error.message);
    throw error;
  }
}

// 查询同步状态
async function getSyncStatus(transactionId, longPoll = false) {
  try {
    const response = await axios.get(
      `${API_BASE}/cards/sync-status`,
      {
        params: {
          transaction_id: transactionId,
          long_poll: longPoll
        },
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('查询状态失败:', error.response?.data || error.message);
    throw error;
  }
}

// 使用示例
(async () => {
  const result = await withdrawCard('category-id-here');
  console.log('取出的卡密:', result);
})();
```

### Python

```python
import requests

API_BASE = 'http://localhost:14124/kami_manager/api/v1'
API_KEY = 'your-api-key'

def withdraw_card(category_id):
    """取卡操作"""
    url = f'{API_BASE}/cards/withdraw'
    headers = {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
    data = {
        'category_id': category_id
    }
    
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    print(f"取卡成功: {result['data']}")
    print(f"卡密ID: {result['data']['cardsID']}")
    print(f"卡密代码: {result['data']['code']}")
    
    return result['data']

def get_sync_status(transaction_id, long_poll=False):
    """查询同步状态"""
    url = f'{API_BASE}/cards/sync-status'
    params = {
        'transaction_id': transaction_id,
        'long_poll': long_poll
    }
    headers = {
        'X-API-Key': API_KEY
    }
    
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    
    return response.json()['data']

# 使用示例
if __name__ == '__main__':
    result = withdraw_card('category-id-here')
    print(f'取出的卡密: {result}')
```

### PHP

```php
<?php

$API_BASE = 'http://localhost:14124/kami_manager/api/v1';
$API_KEY = 'your-api-key';

function withdrawCard($categoryId) {
    global $API_BASE, $API_KEY;
    
    $url = $API_BASE . '/cards/withdraw';
    $data = json_encode(['category_id' => $categoryId]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $API_KEY,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 && $httpCode !== 201) {
        throw new Exception('取卡失败: HTTP ' . $httpCode);
    }
    
    $result = json_decode($response, true);
    echo "取卡成功: " . json_encode($result['data']) . "\n";
    echo "卡密ID: " . $result['data']['cardsID'] . "\n";
    echo "卡密代码: " . $result['data']['code'] . "\n";
    
    return $result['data'];
}

function getSyncStatus($transactionId, $longPoll = false) {
    global $API_BASE, $API_KEY;
    
    $url = $API_BASE . '/cards/sync-status?' . http_build_query([
        'transaction_id' => $transactionId,
        'long_poll' => $longPoll ? 'true' : 'false'
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $API_KEY
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('查询状态失败: HTTP ' . $httpCode);
    }
    
    $result = json_decode($response, true);
    return $result['data'];
}

// 使用示例
try {
    $result = withdrawCard('category-id-here');
    echo "取出的卡密: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
}
?>
```

---

## Webhook说明

### Webhook事件

- `card.withdrawn`: 卡密被取出时触发

### Webhook Payload

```json
{
  "event": "card.withdrawn",
  "data": {
    "transaction_id": "xxx",
    "card_id": "card-uuid",
    "card_code": "CARD-CODE-123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Webhook签名验证

如果设置了 `secret_token`，Webhook请求会包含 `X-Webhook-Signature` 头，格式为：

```
X-Webhook-Signature: sha256=<signature>
```

签名计算方式：

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secretToken)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

## 性能指标

- 取卡操作响应时间: < 500ms (P95)
- 并发支持: 至少100 QPS
- 限流策略: 每个API Key每分钟100次请求（可配置）
- 熔断阈值: 错误率超过50%时触发，30秒后尝试恢复

---

## 注意事项

1. **API Key安全**: 请妥善保管API Key，不要在客户端代码中暴露
2. **HTTPS**: 生产环境必须使用HTTPS
3. **限流**: 注意请求频率限制，避免触发限流
4. **cardsID字段**: 取卡操作返回的卡密ID字段名为 `cardsID`（注意大小写）
5. **原子性**: 取卡操作使用数据库事务确保原子性，不会出现重复取卡的情况
6. **长轮询**: 同步状态查询支持长轮询，适合需要实时获取状态的场景
7. **GET /api/v1/cards 接口区别**: 
   - 在"4. 卡片查询"中的 `GET /api/v1/cards?category_id={category_id}` 仅返回**未使用的卡片**（`isUsed = false`）
   - 在"8. 卡密管理"中的 `GET /api/v1/cards` 返回**所有卡片**（包括已使用和未使用的）
   - 请根据实际需求选择合适的接口
8. **字段命名**: 请求和响应中的字段名遵循驼峰命名（camelCase），如 `categoryId`、`isUsed`、`usedBy` 等

---

## 版本信息

- API版本: v1
- 文档版本: 1.1.0
- 最后更新: 2024-12-19

