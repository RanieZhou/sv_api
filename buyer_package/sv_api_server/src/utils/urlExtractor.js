/**
 * 从原始分享文本中正则提取真正的 HTTP / HTTPS URL 链接
 * 样例：
 *   "4.89 JvF:/ :8pm 11/22 彝族火把节 https://v.douyin.com/UejKmdQ-ahA/ 复制此链接..."
 *   -> "https://v.douyin.com/UejKmdQ-ahA/"
 */
export function extractUrl(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }
  const match = rawText.match(/https?:\/\/[^\s]+/i);
  return match ? match[0].trim() : rawText.trim();
}
