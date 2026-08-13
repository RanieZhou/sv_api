# 🚀 云边去水印小程序独立版 - 部署使用教程

欢迎使用云边去水印小程序全套独立部署源码包！

---

## 📁 目录结构

解压源码包后包含以下 2 个文件夹：

```text
buyer_package/
├── miniprogram/        # 微信小程序前端源码 (原生微信小程序)
└── sv_api_server/      # 服务端核心程序 (包含 API 接口与 /admin/ 小程序管理后台)
```

---

## ⚙️ 部署准备与端口

| 组件 | 说明 | 运行端口 | 推荐域名绑定路径 |
| :--- | :--- | :--- | :--- |
| **API 服务端 (`sv_api_server`)** | Node.js 核心后端服务 | `3005` (可自由修改) | `https://您的域名.com` |
| **小程序管理后台 (`/admin/`)** | Express 自动托管 | 随服务端 | `https://您的域名.com/admin/` |

---

## 🛠️ 第一步：服务端部署 (`sv_api_server`)

### 1. 上传代码与配置 `.env` 环境变量
将 `sv_api_server` 目录复制上传至服务器（例如：`/www/wwwroot/sv_api_server`），在其根目录下创建或编辑 `.env` 文件：

```env
# 服务运行端口
PORT=3005

# MySQL 数据库配置 (建议填入您的 MySQL 信息；若未配置 MySQL，服务端会自动使用内置本地 SQLite 零配置运行)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sv_api
DB_USER=root
DB_PASS=您的数据库密码

# 小程序管理后台 (/admin/) 登录密码
ADMIN_PASSWORD=admin123456

# 后台安全 Token
ADMIN_TOKEN=sv_admin_secret_token_2026
```

### 2. 数据库初始化 (使用 MySQL 时)
在 MySQL 中创建名为 `sv_api` 的数据库，并导入 `sv_api_server/schema.sql`。

### 3. 安装依赖与启动服务
在服务器终端运行：

```bash
cd /www/wwwroot/sv_api_server
npm install

# 使用 PM2 启动服务并持久化守护
pm2 start src/app.js --name "sv-api-server"
pm2 save
pm2 startup
```

### 4. Nginx 反向代理配置 (以宝塔面板为例)
在宝塔面板新建站点 `您的域名.com` 并申请安装 SSL 证书。
打开站点设置 → 【反向代理】 → 【添加反向代理】：
- **代理名称**：`sv_api_proxy`
- **目标 URL**：`http://127.0.0.1:3005`
- **发送域名**：`$host`

---

## 📱 第二步：微信小程序配置与上线 (`miniprogram`)

### 1. 修改 API 接口地址
用 **微信开发者工具** 打开 `miniprogram` 源码目录。

编辑 `miniprogram/config/env.js` 文件，将 `BASE_URL` 改为您自己的服务端域名：

```javascript
module.exports = {
  // 修改为您的独立服务端域名
  BASE_URL: 'https://您的域名.com/api',
  
  getApiUrl(path) {
    return `${this.BASE_URL}${path}`;
  }
};
```

### 2. 配置微信公众平台合法域名
登录 [微信公众平台 (mp.weixin.qq.com)](https://mp.weixin.qq.com/) → 「开发管理」 → 「开发设置」 → 「服务器域名」：
- **request 合法域名**：添加 `https://您的域名.com`
- **uploadFile 合法域名**：添加 `https://您的域名.com`
- **downloadFile 合法域名**：添加 `https://您的域名.com`

---

## 🔑 第三步：绑定授权 API Key 并上线

1. 浏览器打开您独立部署的小程序管理后台：`https://您的域名.com/admin/`；
2. 输入 `.env` 中设置的密码登录后台（默认：`admin123456`）；
3. 点击左侧导航栏 **【接口设置】**；
4. 填入向授权商/站长购买的 **API Key**（如 `sk_...`），点击【校验密钥】与【保存配置】；
5. 您可以在后台自由配置小程序的 **首页公告**、**Banner 轮播图** 以及 **微信流量主广告 ID**；
6. 在微信开发者工具中点击 **【上传】**，并在微信公众平台提交审核发布，即可正式上线运营！
