# 🚀 全套系统独立部署教程 (小程序前端 + 管理后台 + Node 服务端)

本文档提供全套系统的部署说明，帮助您在新的服务器或域名环境中完成部署。

---

## 📁 目录结构说明

文件夹 `sv_api_deploy_package` 包含以下完整组件：

```text
sv_api_deploy_package/
├── miniprogram/        # 微信小程序前端源码 (原生微信小程序)
├── admin/              # 小程序后台管理系统前端 (Vue3 + Vite + ElementPlus)
├── sv_api_server/      # 核心 API 服务端 (Node.js + Express + Key控制台 + 发卡商城 API)
├── store/              # 自动发卡售卖商城前端 (HTML5 + Tailwind CSS)
└── DEPLOY_TUTORIAL.md  # 部署说明文档
```

---

## ⚙️ 端口与域名规划

| 组件 | 部署方式 | 默认端口 | 推荐绑定域名 / URL 路径 |
| :--- | :--- | :--- | :--- |
| **API 服务端 (`sv_api_server`)** | Node.js (PM2 进程) | `3005` | `https://shortvideo.aihubzone.cn` |
| **小程序后台管理系统 (`admin`)** | Nginx 静态托管 | `80/443` | `https://watermark.aihubzone.cn` |
| **Key 站长控制台 (`keyadmin`)** | Express 内置托管 | 随服务端 | `https://shortvideo.aihubzone.cn/keyadmin/` |
| **自动发卡售卖商城 (`store`)** | Express 内置托管 | 随服务端 | `https://shortvideo.aihubzone.cn/store/` |

---

## 🛠️ 第一步：服务端部署 (`sv_api_server`)

### 1. 环境依赖要求
- **Node.js**：v18.0.0+ 或 v20.x
- **MySQL**：v5.7 或 v8.0（数据库字符集建议使用 `utf8mb4`；若未配置 MySQL，服务端会自动降级为本地 SQLite `data/local_test.db`）
- **PM2**：Node 进程守护工具 (`npm install -g pm2`)

### 2. 上传代码与配置 `.env` 环境变量
将 `sv_api_server` 上传至服务器目录（例如：`/www/wwwroot/sv_api_server`），并在该目录下复制或新建 `.env` 配置文件：

```env
# 服务运行端口
PORT=3005

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sv_api
DB_USER=root
DB_PASS=您的数据库密码

# 管理员 Key 控制台登录密码 (https://your-domain.com/keyadmin/)
ADMIN_PASSWORD=admin123456

# 后台 REST API 安全 Token
ADMIN_TOKEN=sv_admin_secret_token_2026

# 上游第三方解析 API 接口
UPSTREAM_API_URL=https://api.bugpk.com/api/short_videos
```

### 3. 初始化 MySQL 数据库
1. 在 MySQL 中创建数据库 `sv_api`；
2. 将 `sv_api_server/schema.sql` 导入到数据库中。

### 4. 安装依赖并启动服务
在服务端根目录下运行：

```bash
cd /www/wwwroot/sv_api_server
npm install

# 使用 PM2 启动并持久化守护
pm2 start src/app.js --name "sv-api-server"
pm2 save
pm2 startup
```

### 5. Nginx 反向代理配置 (宝塔面板示例)
在宝塔面板新建站点 `shortvideo.aihubzone.cn`，部署 SSL 证书后，打开【反向代理】设置：
- **代理名称**：`sv_api_proxy`
- **目标 URL**：`http://127.0.0.1:3005`
- **发送域名**：`$host`

---

## 💻 第二步：小程序后台管理系统部署 (`admin`)

### 1. 修改前端 API 请求域名
打开 `admin/src/utils/api.ts`（或 `vite.config.ts`），确保 `baseURL` 指向您第一步部署的服务端域名：

```typescript
const apiBaseUrl = 'https://shortvideo.aihubzone.cn/api'
```

### 2. 构建打包静态资源
在本地或服务器终端进入 `admin` 目录：

```bash
cd admin
npm install
npm run build
```

打包完成后，会生成 `admin/dist` 文件夹。

### 3. Nginx 部署
在宝塔面板新建站点 `watermark.aihubzone.cn`，配置 SSL 证书，将 `admin/dist` 中的全部内容上传至该站点的根目录。

---

## 📱 第三步：微信小程序配置与上线 (`miniprogram`)

### 1. 修改小程序 API 域名
使用 **微信开发者工具** 打开 `miniprogram` 源码目录。

修改 `miniprogram/config/env.js` 文件：

```javascript
module.exports = {
  // 服务端域名地址
  BASE_URL: 'https://shortvideo.aihubzone.cn/api',
  
  getApiUrl(path) {
    return `${this.BASE_URL}${path}`;
  }
};
```

### 2. 配置微信公众平台合法域名
登录 [微信公众平台 (mp.weixin.qq.com)](https://mp.weixin.qq.com/) → 「开发管理」 → 「开发设置」 → 「服务器域名」：
- **request 合法域名**：添加 `https://shortvideo.aihubzone.cn`
- **uploadFile 合法域名**：添加 `https://shortvideo.aihubzone.cn`
- **downloadFile 合法域名**：添加 `https://shortvideo.aihubzone.cn`

### 3. 上线运行
1. 打开小程序后台管理系统 (`https://watermark.aihubzone.cn`)，登录后进入【接口设置】；
2. 在 Key 控制台 (`https://shortvideo.aihubzone.cn/keyadmin/`) 生成或复制一个有效的 API Key；
3. 将 API Key 填入小程序后台【接口设置】并保存；
4. 在微信开发者工具中点击【上传】，并在微信公众平台提交审核发布！

---

## 🔒 支付与发卡配置（可选）

如需开启支付宝扫码自动发卡：
1. 登录 Key 控制台 (`https://shortvideo.aihubzone.cn/keyadmin/`)；
2. 进入【支付宝配置】，填入支付宝 AppID、应用私钥、支付宝公钥；
3. 进入【商品管理】，添加/上架对应套餐商品；
4. 用户在发卡商城 (`https://shortvideo.aihubzone.cn/store/`) 扫码付款后，系统将在 1-2 秒内自动生成 API Key 并同步显示！
