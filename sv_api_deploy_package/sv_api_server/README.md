# SV-API 服务端 (Node.js + Vue 3)

基于 **Node.js (Express)** 与 **Vue 3** 构建的短视频无水印解析 API 服务网关与后台管理系统。

---

## ✨ 核心特性

- 🚀 **后端 (Node.js + Express + MySQL)**：高并发代理上游 `https://api.bugpk.com/api/short_videos`。
- 🔑 **API Key 鉴权与额度管控**：支持无限次/有限次数、到期时间校验、状态禁用、原子扣费。
- 🔍 **正文链接智能提取**：用户直接粘贴 App 包含描述的完整分享文本，后端自动提取 `http(s)://...` 真实链接。
- 📊 **调用日志与统计**：精准记录每笔调用的 IP、目标 URL、响应耗时、状态码。
- 💻 **Vue 3 现代化后台管理系统** (`/admin/`)：美观高颜值的可视化面板，支持一键生成 Key、续费、禁用、日志查询等。
- 🧪 **在线测试工具** (`/test.html`)：前端可视化测试解析效果。

---

## 🛠️ 安装与部署指南

### 第一步：环境要求
- **Node.js**: v18.0.0 或更高版本
- **MySQL**: v5.7 或 v8.0+

---

### 第二步：数据库初始化

```sql
-- 1. 创建数据库
CREATE DATABASE sv_api DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 导入 schema.sql 脚本
USE sv_api;
SOURCE /path/to/sv_api_server/schema.sql;
```

---

### 第三步：安装 Node.js 依赖

在项目根目录下执行：

```bash
npm install
```

---

### 第四步：修改配置文件 (`.env`)

打开 `.env` 文件，配置你的 MySQL 连接和管理员密码：

```env
PORT=3000

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sv_api
DB_USER=root
DB_PASS=你的数据库密码

# ⚠️ 管理员后台登录密码（用于 /admin/ 登录）
ADMIN_PASSWORD=admin123456

# 上游免费解析接口
UPSTREAM_API_URL=https://api.bugpk.com/api/short_videos
```

---

### 第五步：启动服务

#### 本地开发模式
```bash
npm run dev
```

#### 生产环境运行（推荐使用 PM2 守护进程）
```bash
# 全局安装 PM2
npm install -g pm2

# 启动 Node.js 服务
pm2 start src/app.js --name "sv-api"

# 设置开机自启
pm2 startup
pm2 save
```

---

## 🌐 访问地址与接口说明

假设你的服务器地址或域名为 `https://shortvideo.aihubzone.cn`：

| 模块 | 访问路径 |
|---|---|
| **对外解析 API** | `GET /api/parse?url=xxx&api_key=xxx` |
| **后台管理系统** | `https://shortvideo.aihubzone.cn/admin/` |
| **在线测试工具** | `https://shortvideo.aihubzone.cn/test.html` |

---

## 🔑 默认测试 API Key

系统初始化时已植入一条内置测试 Key：

```
sk_test_00000000000000000000000000000001
```

*（不限次数，永不过期，方便开箱测试）*
