# 🔐 卡密管家

一个现代化的卡密管理系统，支持批量导入导出、分类标签、备注管理和公告功能。

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)

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
- React 18 + TypeScript
- Vite (构建工具)
- Framer Motion (动画)
- Lucide React (图标)
- CSS Modules

**后端:**
- Node.js + Express
- MySQL 8.0+
- mysql2 (数据库驱动)

**本地存储 (可选):**
- IndexedDB + Dexie.js

## 📦 安装部署

### 方式一：仅前端 (IndexedDB 本地存储)

适合个人使用，数据存储在浏览器本地。

```bash
# 克隆项目
git clone https://github.com/你的用户名/kami.git
cd kami

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
git clone https://github.com/你的用户名/kami.git
cd kami

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
- 后端 API: http://localhost:3001/api

> 💡 数据库和表会在首次启动后端时自动创建

## 📁 项目结构

```
kami/
├── public/               # 静态资源
├── server/               # 后端服务
│   ├── index.js          # Express 入口
│   ├── db.js             # MySQL 配置
│   └── package.json
├── src/
│   ├── api/              # API 请求封装
│   ├── components/       # React 组件
│   │   ├── Announcement/ # 公告栏
│   │   ├── BatchActions/ # 批量操作栏
│   │   ├── CardItem/     # 卡密项
│   │   ├── CardList/     # 卡密列表
│   │   ├── CategoryTabs/ # 分类标签
│   │   ├── ImportModal/  # 导入弹窗
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

### settings 表 (设置)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| announcement | TEXT | 公告内容 |

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings | 获取设置 |
| PUT | /api/settings/announcement | 更新公告 |
| GET | /api/categories | 获取所有分类 |
| POST | /api/categories | 添加分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类 |
| GET | /api/cards | 获取所有卡密 |
| POST | /api/cards/batch | 批量添加卡密 |
| PUT | /api/cards/:id | 更新单个卡密 |
| PUT | /api/cards/batch | 批量更新卡密 |
| DELETE | /api/cards/:id | 删除单个卡密 |
| DELETE | /api/cards/batch | 批量删除卡密 |

## 🚀 生产部署

### 前端构建

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任意静态托管服务 (Nginx, Vercel, Netlify 等)。

### 后端部署

```bash
cd server
npm start
```

建议使用 PM2 进行进程管理：

```bash
npm install -g pm2
pm2 start index.js --name kami-server
pm2 save
```

### 环境变量 (可选)

可以通过环境变量配置数据库连接：

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kami_manager
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

