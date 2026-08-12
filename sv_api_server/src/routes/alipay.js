import express from 'express';
import crypto from 'crypto';
import { queryOne, execute } from '../db.js';
import { getAlipayInstance } from '../utils/alipayInstance.js';

const router = express.Router();

/**
 * POST /api/alipay/notify
 * 支付宝异步回调通知 (notify_url)
 * 支付宝文档要求：必须返回纯文本 "success" 字符串，否则会持续重试
 */
router.post('/notify', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const postData = req.body;
    console.log('[Alipay Notify] 收到支付宝回调通知:', JSON.stringify(postData));

    // 1. 获取支付宝实例并验签
    const alipaySdk = await getAlipayInstance();
    if (!alipaySdk) {
      console.error('[Alipay Notify] 支付宝 SDK 未配置，忽略通知');
      return res.send('success'); // 避免支付宝一直重试
    }

    const signValid = alipaySdk.checkNotifySign(postData);
    if (!signValid) {
      console.error('[Alipay Notify] 验签失败，丢弃此次通知');
      return res.send('fail');
    }

    // 2. 仅处理成功状态
    const { trade_status, out_trade_no: orderNo, trade_no: alipayTradeNo } = postData;
    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      console.log(`[Alipay Notify] 非成功状态 trade_status=${trade_status}，忽略`);
      return res.send('success');
    }

    // 3. 查询订单
    const order = await queryOne('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
    if (!order) {
      console.error(`[Alipay Notify] 订单不存在: ${orderNo}`);
      return res.send('success');
    }
    if (order.pay_status === 1) {
      console.log(`[Alipay Notify] 订单 ${orderNo} 已处理，忽略重复通知`);
      return res.send('success');
    }

    // 4. 生成 API Key
    const apiKey = 'sk_' + crypto.randomBytes(20).toString('hex');

    // 5. 计算到期时间
    const d = new Date();
    d.setDate(d.getDate() + order.expire_days);
    const expireTimeStr = d.toISOString().slice(0, 19).replace('T', ' ');

    // 6. 写入 api_keys 表
    await execute(
      `INSERT INTO api_keys (api_key, user_name, status, total_quota, used_quota, qps_limit, expire_time, note)
       VALUES (?, ?, 1, ?, 0, 10, ?, ?)`,
      [apiKey, order.user_name, order.quota, expireTimeStr, `[支付宝购买] ${order.package_name} (¥${order.amount})`]
    );

    // 7. 更新订单状态
    await execute(
      `UPDATE orders SET pay_status = 1, api_key = ?, paid_at = DATETIME('now', 'localtime') WHERE order_no = ?`,
      [apiKey, orderNo]
    );

    console.log(`[Alipay Notify] 订单 ${orderNo} 支付成功，已生成 Key: ${apiKey.slice(0, 16)}...`);
    return res.send('success');

  } catch (err) {
    console.error('[Alipay Notify] 处理回调异常:', err);
    return res.send('fail');
  }
});

export default router;
