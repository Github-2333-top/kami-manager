# 🔐 卡密管家

一个现代化的卡密管理系统，支持批量导入导出、分类标签、备注管理和公告功能。

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)

## ✨ 功能特性

- 📋 **批量导入** - 从剪贴板一键导入卡密，自动去重去空
- 📤 **灵活导出** - 支持导出全部/筛选后的卡密，可选是否包含备注
- 🏷️ **分类管理** - 自定义分类标签和颜色，快速筛选
- 📝 **备注功能** - 为每个卡密添加备注和使用者信息
- 📢 **公告栏** - 顶部可编辑公告区域
- 🔍 **搜索筛选** - 按卡密、备注、使用者搜索，按状态筛选
- ✅ **批量操作** - 多选后批量设置分类、备注、标记状态、删除
- 🎨 **流畅动画** - 基于 Framer Motion 的精致交互动画
- 💾 **数据持久化** - 支持 IndexedDB 本地存储或 MySQL 云端存储

## 📸 界面预览

```
+--------------------------------------------------+
|              📢 公告栏 (可编辑)                    |
+--------------------------------------------------+
| [导入] [导出▼]              🔍 搜索框   [状态筛选] |
+--------------------------------------------------+
| [全部] [未分类] [VIP] [普通] [测试] [+添加分类]    |
+--------------------------------------------------+
|  □ | 卡密代码      | 分类  | 备注   | 使用者 | 状态|
|  □ | XXXX-XXXX    | VIP   | 测试用 | 张三   | 已用|
|  □ | YYYY-YYYY    | 普通  |        |        | 未用|
+--------------------------------------------------+
```

## 🛠️ 技术栈

**前端:**
- React 19 + TypeScript 5.9
- Vite 7 (构建工具)
- Framer Motion (动画)
- Lucide React (图标)
- CSS Modules

**后端:**
- Node.js 18+ + Express 4
- MySQL 8.0+
- mysql2 (数据库驱动)

**本地存储 (可选):**
- IndexedDB + Dexie.js

## 📦 安装部署

### 方式一：仅前端 (IndexedDB 本地存储)

适合个人使用，数据存储在浏览器本地。

```bash
# 克隆项目
git clone https://github.com/Github-2333-top/kami-manager.git
cd kami-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 方式二：前端 + MySQL 后端

适合多设备同步或团队使用。

#### 1. 环境要求

- Node.js 18+
- MySQL 8.0+

#### 2. 配置数据库

编辑 `server/db.js`，修改 MySQL 连接信息：

```javascript
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',           // MySQL 用户名
  password: 'your_password', // MySQL 密码
  database: 'kami_manager',
}
```

#### 3. 安装并启动

```bash
# 克隆项目
git clone https://github.com/Github-2333-top/kami-manager.git
cd kami-manager

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..

# 启动后端 (终端1)
cd server
npm run dev

# 启动前端 (终端2)
npm run dev
```

- 前端访问: http://localhost:5173
- 后端 API: http://localhost:14124/api

> 💡 数据库和表会在首次启动后端时自动创建

## 📁 项目结构

```
kami-manager/
├── public/               # 静态资源
├── server/               # 后端服务
│   ├── src/              # TypeScript 源码
│   │   ├── index.ts      # Express 入口
│   │   ├── db.ts         # MySQL 配置
│   │   ├── routes/       # 路由
│   │   ├── middleware/  # 中间件
│   │   └── services/    # 服务层
│   ├── migrations/       # 数据库迁移脚本
│   ├── tsconfig.json     # TypeScript 配置
│   └── package.json
├── src/
│   ├── api/              # API 请求封装
│   ├── components/       # React 组件
│   │   ├── Announcement/ # 公告栏
│   │   ├── BatchActions/ # 批量操作栏
│   │   ├── CardItem/     # 卡密项
│   │   ├── CardList/     # 卡密列表
│   │   ├── CategoryTabs/ # 分类标签
│   │   ├── ColorPicker/  # 颜色选择器
│   │   ├── ImportModal/  # 导入弹窗
│   │   ├── Loading/      # 加载状态
│   │   ├── Modal/        # 通用弹窗
│   │   ├── Toast/        # 消息提示
│   │   └── Toolbar/      # 工具栏
│   ├── db/               # IndexedDB 配置
│   ├── hooks/            # 自定义 Hooks
│   ├── types/            # TypeScript 类型
│   ├── utils/            # 工具函数
│   ├── App.tsx           # 主组件
│   └── main.tsx          # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🗃️ 数据库结构

### cards 表 (卡密)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 UUID |
| code | VARCHAR(255) | 卡密代码 (唯一) |
| category_id | VARCHAR(36) | 分类 ID |
| remark | TEXT | 备注 |
| used_by | VARCHAR(255) | 使用者 |
| is_used | BOOLEAN | 是否已使用 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### categories 表 (分类)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 UUID |
| name | VARCHAR(100) | 分类名称 |
| color | VARCHAR(20) | 颜色代码 |
| created_at | TIMESTAMP | 创建时间 |

### settings 表 (设置)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| announcement | TEXT | 公告内容 |

## 🔌 API 接口

所有API已迁移至 `/api/v1/` 路径。详细文档请参考 [API-v1.md](docs/API-v1.md)

### 核心接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/health | 健康检查 |
| GET | /api/v1/stats | 获取统计数据 |
| GET | /api/v1/settings | 获取设置 |
| PUT | /api/v1/settings/announcement | 更新公告 |
| GET | /api/v1/categories | 获取所有分类 |
| POST | /api/v1/categories | 添加分类 |
| PUT | /api/v1/categories/:id | 更新分类 |
| DELETE | /api/v1/categories/:id | 删除分类 |
| GET | /api/v1/cards | 获取所有卡密 |
| POST | /api/v1/cards/batch | 批量添加卡密 |
| PUT | /api/v1/cards/:id | 更新单个卡密 |
| PUT | /api/v1/cards/batch | 批量更新卡密 |
| DELETE | /api/v1/cards/:id | 删除单个卡密 |
| DELETE | /api/v1/cards/batch | 批量删除卡密 |

### 第三方平台接口（需要API Key认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/cards/categories | 获取所有可用分类列表 |
| GET | /api/v1/cards?category_id={id} | 根据分类ID获取可用卡片列表 |
| POST | /api/v1/cards/withdraw | 执行取卡操作（随机取一张） |
| GET | /api/v1/cards/sync-status | 查询同步状态（支持长轮询） |
| POST | /api/v1/webhooks | 注册Webhook回调 |
| GET | /api/v1/webhooks | 查询Webhook订阅列表 |
| DELETE | /api/v1/webhooks/:id | 删除Webhook订阅 |

## 🚀 生产部署

### 1. 前端构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 2. 后端部署 (PM2)

使用 PM2 进行进程管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd server
# 安装依赖并构建（生成 dist/）
npm install
npm run build
pm2 start index.js --name kami-server

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

**常用 PM2 命令:**

```bash
pm2 ls                    # 查看进程列表
pm2 logs kami-server      # 查看日志
pm2 restart kami-server   # 重启服务
pm2 stop kami-server      # 停止服务
pm2 delete kami-server    # 删除进程
```

### 3. Nginx 反向代理配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # 前端静态资源
    location /kami_manager/ {
        alias /path/to/kami-manager/dist/;
        index index.html;
        try_files $uri $uri/ /kami_manager/index.html;
    }

    # 处理 SPA 路由回退
    location = /kami_manager/index.html {
        alias /path/to/kami-manager/dist/index.html;
    }

    # API 代理（推荐：与前端同子路径，避免前端额外配置）
    location /kami_manager/api/v1/ {
        proxy_pass http://127.0.0.1:14124/kami_manager/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API 兼容代理（可选：兼容旧脚本 /api/v1/*）
    location /api/v1/ {
        proxy_pass http://127.0.0.1:14124/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json application/xml;
}
```

配置完成后重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Vite 子路径配置

如果部署在子路径下（如 `/kami_manager/`），需要修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/kami_manager/',
  // ...其他配置
})
```

同时确认 `src/api/client.ts` 中的 API 路径与后端一致：

```typescript
const API_BASE = '/kami_manager/api/v1'
```

### 5. 环境变量 (可选)

可以通过环境变量配置数据库连接：

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=kami_manager
```

## 🔧 故障排查

### 502 Bad Gateway

1. 检查后端服务是否运行：`pm2 ls`
2. 查看后端日志：`pm2 logs kami-server`
3. 确认 Nginx 代理端口正确（默认 14124）
4. 重载 Nginx 配置：`sudo nginx -t && sudo systemctl reload nginx`

### 数据库连接失败

1. 检查 MySQL 服务状态：`systemctl status mysql`
2. 验证数据库配置：`server/db.js`
3. 确认用户权限：`GRANT ALL ON kami_manager.* TO 'user'@'localhost';`

### 健康检查

```bash
# 直接访问后端
curl http://127.0.0.1:14124/kami_manager/api/v1/health

# 通过 Nginx 代理
curl https://your-domain.com/kami_manager/api/v1/health
```

正常返回：
```json
{"status":"healthy","timestamp":"...","database":"connected"}
```

## 📄 开源协议

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request
