import nodemailer from 'nodemailer';
import { queryOne } from '../db.js';

// 内存验证码存储 (email -> { code, expiresAt, lastSentAt })
const codeMap = new Map();

// 清理定时器（防止内存溢出）
setInterval(() => {
  const now = Date.now();
  for (const [email, item] of codeMap.entries()) {
    if (now > item.expiresAt) {
      codeMap.delete(email);
    }
  }
}, 60 * 1000);

/**
 * 读取 QQ 邮箱配置
 */
export async function getEmailConfig() {
  try {
    const row = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'email_config'", []);
    if (!row || !row.config_value) return null;
    return JSON.parse(row.config_value);
  } catch (e) {
    console.error('[Mailer] 读取邮箱配置失败:', e.message);
    return null;
  }
}

/**
 * 构建 Nodemailer 传输器
 */
export async function createTransporter(customConfig = null) {
  const cfg = customConfig || await getEmailConfig();
  if (!cfg || !cfg.qqNumber || !cfg.authCode) {
    throw new Error('系统尚未配置 QQ 邮箱和授权码，请联系管理员');
  }

  // 补全 QQ 邮箱地址
  let qqNumber = cfg.qqNumber.trim();
  let userEmail = qqNumber.includes('@') ? qqNumber : `${qqNumber}@qq.com`;

  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true, // 使用 SSL
      auth: {
        user: userEmail,
        pass: cfg.authCode.trim()
      }
    }),
    senderEmail: userEmail
  };
}

/**
 * 发送邮箱验证码
 */
export async function sendVerificationCode(targetEmail) {
  const email = targetEmail.trim().toLowerCase();
  const now = Date.now();

  // 1. 发送频率限制 (60s 冷却)
  const existing = codeMap.get(email);
  if (existing && now - existing.lastSentAt < 60 * 1000) {
    const waitSecs = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
    throw new Error(`请求太频繁，请在 ${waitSecs} 秒后再试`);
  }

  // 2. 生成 6 位数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 10 * 60 * 1000; // 10 分钟有效

  // 3. 创建发送器并发送邮件
  const { transporter, senderEmail } = await createTransporter();

  const mailOptions = {
    from: `"云边去水印API 授权商城" <${senderEmail}>`,
    to: email,
    subject: `【云边去水印API 授权商城】您的注册验证码：${code}`,
    html: `
      <div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: 'Helvetica Neue', Arial, sans-serif; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; text-align: center; margin-bottom: 20px;">⚡ 云边去水印API 授权商城</h2>
        <p style="font-size: 14px; color: #cbd5e1;">尊敬的用户：</p>
        <p style="font-size: 14px; color: #cbd5e1;">您正在注册 云边去水印API 授权商城账号，本次注册验证码为：</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 800; color: #38bdf8; letter-spacing: 6px; padding: 12px 28px; background: rgba(56, 189, 248, 0.1); border: 1px dashed #38bdf8; border-radius: 8px;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">• 验证码有效期为 <strong>10 分钟</strong>，请尽快完成注册。</p>
        <p style="font-size: 12px; color: #94a3b8;">• 如果这不是您的操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">云边去水印API 官方发卡授权平台</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);

  // 4. 存入内存 map
  codeMap.set(email, {
    code,
    expiresAt,
    lastSentAt: now
  });

  return { success: true, message: '验证码已发送至您的邮箱，请注意查收' };
}

/**
 * 校验验证码
 */
export function verifyVerificationCode(targetEmail, inputCode) {
  const email = targetEmail.trim().toLowerCase();
  const code = (inputCode || '').trim();

  if (!email || !code) {
    return { valid: false, message: '邮箱地址和验证码不能为空' };
  }

  const record = codeMap.get(email);
  if (!record) {
    return { valid: false, message: '尚未发送验证码或验证码已失效' };
  }

  if (Date.now() > record.expiresAt) {
    codeMap.delete(email);
    return { valid: false, message: '验证码已过期，请重新获取' };
  }

  if (record.code !== code) {
    return { valid: false, message: '验证码不正确，请检查后重新输入' };
  }

  // 验证通过，清理验证码防止二次复用
  codeMap.delete(email);
  return { valid: true };
}
