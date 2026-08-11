import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getConfig, updateConfig } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3008;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'mp_admin_secret_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 中间件：管理员 Token 校验
function adminAuth(req, res, next) {
  const token =
    req.headers['x-admin-token'] ||
    req.headers.authorization?.replace('Bearer ', '') ||
    req.query.token;

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ code: 401, msg: '管理员身份验证失败' });
  }
  next();
}

// 1. 小程序前端启动调用的公开配置接口
app.get('/api/mp/config', (req, res) => {
  const cfg = getConfig();
  res.json({
    code: 200,
    msg: 'ok',
    data: cfg,
  });
});

// 2. 后台管理登录
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({
      code: 200,
      msg: '登录成功',
      data: { token: ADMIN_TOKEN },
    });
  } else {
    res.status(400).json({ code: 400, msg: '密码错误，请输入正确的管理员密码' });
  }
});

// 3. 后台管理获取全量配置
app.get('/api/admin/config', adminAuth, (req, res) => {
  res.json({
    code: 200,
    msg: 'ok',
    data: getConfig(),
  });
});

// 4. 后台管理保存配置
app.post('/api/admin/config', adminAuth, (req, res) => {
  try {
    const updated = updateConfig(req.body);
    res.json({
      code: 200,
      msg: '小程序系统设置保存成功！',
      data: updated,
    });
  } catch (err) {
    console.error('保存配置失败:', err);
    res.status(500).json({ code: 500, msg: '保存配置失败', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`📱 去水印小程序后台管理服务已在端口 ${PORT} 启动！`);
  console.log(`🌐 小程序配置接口:  http://localhost:${PORT}/api/mp/config`);
  console.log(`💻 小程序后台管理:  http://localhost:${PORT}/index.html`);
  console.log(`=======================================================`);
});
