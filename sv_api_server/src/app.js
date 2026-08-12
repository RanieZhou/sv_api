import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

import parseRoutes from './routes/parse.js';
import adminRoutes from './routes/admin.js';
import proxyRoutes from './routes/proxy.js';
import bannersRoutes from './routes/banners.js';
import systemRoutes from './routes/system.js';
import uploadRoutes from './routes/upload.js';
import storeRoutes from './routes/store.js';
import alipayRoutes from './routes/alipay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. 全局中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 静态目录托管
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use('/keyadmin', express.static(path.join(__dirname, '../public/keyadmin')));
app.use('/store', express.static(path.join(__dirname, '../../store')));

// 3. 挂载路由
app.use('/api', parseRoutes);
app.use('/api', proxyRoutes);
app.use('/api', bannersRoutes);
app.use('/api', systemRoutes);
app.use('/api', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/alipay', alipayRoutes);

// 4. 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 5. 启动服务器
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SV-API Node.js 服务已在端口 ${config.port} 成功启动！`);
  console.log(`🌐 对外解析接口:  http://localhost:${config.port}/api/parse?url=xxx&api_key=xxx`);
  console.log(`📱 小程序管理后台: http://localhost:${config.port}/admin/`);
  console.log(`🔑 独立 Key 控制台: http://localhost:${config.port}/keyadmin/`);
  console.log(`🛍️ 授权售卖商城:  http://localhost:${config.port}/store/`);
  console.log(`=======================================================`);
});
