import express from 'express';
import { config } from '../config.js';

const router = express.Router();

/**
 * 买家小程序管理后台 (/admin/) 登录接口
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.adminPassword) {
    return res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token: config.adminToken,
      },
    });
  } else {
    return res.status(400).json({
      code: 400,
      msg: '密码错误，请输入正确的管理员密码',
    });
  }
});

export default router;
