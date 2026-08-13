import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../public/uploads');

// 确保 public/uploads 目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 磁盘存储设置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    cb(null, `banner_${uniqueSuffix}${ext}`);
  }
});

// 文件类型过滤（仅允许图片）
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传 jpg、jpeg、png、gif、webp 格式的图片！'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制 10MB
});

const router = express.Router();

/**
 * POST /api/upload
 * 图片文件上传接口
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, success: false, msg: '未选择任何图片文件' });
    }

    const relativeUrl = `/api/uploads/${req.file.filename}`;

    return res.json({
      code: 200,
      success: true,
      msg: '图片上传成功',
      url: relativeUrl,
      data: {
        url: relativeUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (err) {
    console.error('图片上传处理失败:', err);
    return res.status(500).json({ code: 500, success: false, msg: err.message || '上传处理失败' });
  }
});

// 错误处理中间件（捕获 Multer 限制错误）
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ code: 400, success: false, msg: `上传错误: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ code: 400, success: false, msg: err.message });
  }
  next();
});

export default router;
