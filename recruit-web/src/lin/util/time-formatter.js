/**
 * 时间格式化工具函数集合
 * 用于聊天应用中各种时间显示格式化
 */

/**
 * 格式化消息时间显示
 * 24小时内：显示时间（如 09:30）
 * 昨天：显示"昨天 HH:MM"
 * 7天内：显示"周X HH:MM"
 * 超过7天：显示"M月D日 HH:MM"
 * @param {string} timeString - 日期时间字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatMessageTime(timeString) {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  
  // 检查日期是否有效
  if (isNaN(date)) {
    return timeString;
  }
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // 同一天，只显示时间
  if (isSameDay(date, now)) {
    return timeStr;
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `昨天 ${timeStr}`;
  }
  
  // 7天内，显示周几
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  if (date > oneWeekAgo) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${weekday} ${timeStr}`;
  }
  
  // 超过7天，显示月日
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${month}月${day}日 ${timeStr}`;
}

/**
 * 格式化左侧聊天列表时间显示
 * 24小时内：显示"HH:MM"
 * 超过24小时：显示"M月D日"
 * @param {string} timeString - 日期时间字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatSidebarTime(timeString) {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  
  // 检查日期是否有效
  if (isNaN(date)) {
    return timeString;
  }
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // 24小时内
  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(now.getHours() - 24);
  
  if (date > twentyFourHoursAgo) {
    return `${hours}:${minutes}`;
  }
  
  // 超过24小时
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${month}月${day}日`;
}

/**
 * 判断是否应该显示时间戳
 * 每条消息的第一条或者与前一条消息间隔超过1分钟才显示
 * @param {number} index - 当前消息索引
 * @param {Array} messages - 消息数组
 * @returns {boolean} 是否应该显示时间戳
 */
export function shouldShowTimestamp(index, messages) {
  // 始终显示第一条消息的时间戳
  if (index === 0) {
    return true;
  }

  // 获取消息时间戳
  let currentTimeStr = messages[index].time;
  let prevTimeStr = messages[index - 1].time;

  // 尝试解析时间戳
  let currentMsgTime, prevMsgTime;

  try {
    currentMsgTime = new Date(currentTimeStr);
    prevMsgTime = new Date(prevTimeStr);

    // 检查解析结果是否为有效日期
    if (isNaN(currentMsgTime) || isNaN(prevMsgTime)) {
      return true; // 如果无法正确比较，则显示时间戳
    }

    // 计算时间差（秒）
    const timeDiff = (currentMsgTime - prevMsgTime) / 1000;

    // 如果时间差超过60秒，则显示时间戳
    return timeDiff >= 60;
  } catch (error) {
    // 出现任何错误都显示时间戳
    return true;
  }
}

/**
 * 格式化完整时间戳字符串
 * 返回包含秒的完整时间戳，用于消息存储和比较
 * @returns {string} 格式化的时间戳，格式: YYYY/MM/DD HH:MM:SS
 */
export function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 判断两个日期是否是同一天
 * @param {Date} date1 - 第一个日期
 * @param {Date} date2 - 第二个日期
 * @returns {boolean} 是否为同一天
 */
function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
}