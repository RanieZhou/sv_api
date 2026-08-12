/**
 * 北京时间 (Asia/Shanghai) 日期时间工具库
 */

/**
 * 将 Date 对象、时间戳或时间字符串转为北京时间 (Asia/Shanghai) 字符串 "YYYY-MM-DD HH:mm:ss"
 * @param {Date|number|string} dateInput 
 * @returns {string}
 */
export function formatShanghaiDateTime(dateInput = new Date()) {
  if (!dateInput) return '';
  
  if (typeof dateInput === 'string') {
    let s = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(s)) {
      return s;
    }
    s = s.replace(' ', 'T');
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return formatShanghaiDateTime(d);
    }
    return s;
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput || '');

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(d);

  const map = {};
  parts.forEach(p => map[p.type] = p.value);
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

/**
 * 根据天数计算从当前北京时间起顺延 N 天后的北京时间字符串 "YYYY-MM-DD HH:mm:ss"
 * @param {number} expireDays 天数
 * @returns {string}
 */
export function getShanghaiExpireDateTime(expireDays = 30) {
  const days = Number(expireDays);
  if (isNaN(days) || days <= 0) return null;
  const futureMs = Date.now() + days * 24 * 3600 * 1000;
  return formatShanghaiDateTime(new Date(futureMs));
}
