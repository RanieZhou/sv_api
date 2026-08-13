import express from 'express';
import { queryAll, queryOne, execute } from '../db.js';

const router = express.Router();

function normalizeUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  return url.startsWith('/') ? url : '/' + url;
}

function formatBanner(b) {
  if (!b) return null;
  return {
    id: b.id,
    title: b.title || '',
    imageUrl: normalizeUrl(b.image_url),
    linkUrl: b.link_url || '',
    sortOrder: b.sort_order || 0,
    isActive: b.is_active === 1 || b.is_active === true,
    createdAt: b.created_at
  };
}

// 1. 获取已生交/启用的轮播图列表 (小程序调用: GET /api/banners)
router.get('/banners', async (req, res) => {
  try {
    const list = await queryAll(
      'SELECT id, title, image_url, link_url, sort_order, is_active FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id DESC'
    );
    const data = list.map(formatBanner);
    return res.json({
      code: 200,
      success: true,
      data
    });
  } catch (err) {
    console.error('获取轮播图失败:', err);
    return res.status(500).json({ code: 500, success: false, msg: '获取轮播图失败' });
  }
});

// 2. 获取所有轮播图 (管理端调用: GET /api/banners/admin)
router.get('/banners/admin', async (req, res) => {
  try {
    const list = await queryAll(
      'SELECT id, title, image_url, link_url, sort_order, is_active, created_at FROM banners ORDER BY sort_order ASC, id DESC'
    );
    const data = list.map(formatBanner);
    return res.json({
      code: 200,
      success: true,
      data
    });
  } catch (err) {
    console.error('获取轮播图管理列表失败:', err);
    return res.status(500).json({ code: 500, success: false, msg: '获取轮播图失败' });
  }
});

// 3. 获取单条轮播图详情 (GET /api/banners/:id)
router.get('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ code: 404, success: false, message: '轮播图不存在' });
    }
    return res.json({
      code: 200,
      success: true,
      data: formatBanner(item)
    });
  } catch (err) {
    console.error('获取轮播图详情失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取轮播图详情失败' });
  }
});

// 4. 创建轮播图 (POST /api/banners)
router.post('/banners', async (req, res) => {
  try {
    const { title = '', imageUrl, linkUrl = '', sortOrder = 0, isActive = true } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ code: 400, success: false, message: '图片链接不能为空' });
    }
    const result = await execute(
      'INSERT INTO banners (title, image_url, link_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), imageUrl.trim(), linkUrl.trim(), parseInt(sortOrder, 10) || 0, isActive ? 1 : 0]
    );
    return res.json({
      code: 200,
      success: true,
      message: '轮播图创建成功',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('创建轮播图失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '创建轮播图失败' });
  }
});

// 5. 更新轮播图 (PUT /api/banners/:id)
router.put('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, linkUrl, sortOrder, isActive } = req.body;
    
    const item = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ code: 404, success: false, message: '轮播图不存在' });
    }

    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(title.trim()); }
    if (imageUrl !== undefined) { sets.push('image_url = ?'); params.push(imageUrl.trim()); }
    if (linkUrl !== undefined) { sets.push('link_url = ?'); params.push(linkUrl.trim()); }
    if (sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder, 10) || 0); }
    if (isActive !== undefined) { sets.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return res.json({
      code: 200,
      success: true,
      message: '轮播图更新成功'
    });
  } catch (err) {
    console.error('更新轮播图失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '更新轮播图失败' });
  }
});

// 6. 删除轮播图 (DELETE /api/banners/:id)
router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM banners WHERE id = ?', [id]);
    return res.json({
      code: 200,
      success: true,
      message: '删除成功'
    });
  } catch (err) {
    console.error('删除轮播图失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '删除失败' });
  }
});

export default router;
