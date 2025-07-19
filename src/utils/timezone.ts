/**
 * 时区工具函数 - 解决所有时区相关问题
 */

/**
 * 获取用户本地时区的当前日期时间字符串
 * 格式: YYYY-MM-DDTHH:MM
 * 正确处理用户时区偏移
 */
export const getCurrentLocalDateTime = (): string => {
	const now = new Date();
	// 获取本地时区偏移量（分钟）
	const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
	// 创建本地时间对象
	const localTime = new Date(now.getTime() - timezoneOffsetMs);
	// 返回本地时间的ISO字符串，截取到分钟
	return localTime.toISOString().slice(0, 16);
};

/**
 * 获取用户本地时区的当前日期字符串
 * 格式: YYYY-MM-DD
 * 正确处理用户时区偏移
 */
export const getCurrentLocalDate = (): string => {
	const now = new Date();
	// 获取本地时区偏移量（分钟）
	const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
	// 创建本地时间对象
	const localTime = new Date(now.getTime() - timezoneOffsetMs);
	// 返回本地日期字符串
	return localTime.toISOString().split("T")[0];
};

/**
 * 将Date对象转换为本地时区的日期字符串
 * 格式: YYYY-MM-DD
 */
export const formatDateToLocal = (date: Date): string => {
	const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
	const localTime = new Date(date.getTime() - timezoneOffsetMs);
	return localTime.toISOString().split("T")[0];
};

/**
 * 将Date对象转换为本地时区的日期时间字符串
 * 格式: YYYY-MM-DDTHH:MM
 */
export const formatDateTimeToLocal = (date: Date): string => {
	const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
	const localTime = new Date(date.getTime() - timezoneOffsetMs);
	return localTime.toISOString().slice(0, 16);
};

/**
 * 创建本地时区的Date对象
 * 从 YYYY-MM-DD 字符串创建，避免时区偏移问题
 */
export const createLocalDate = (dateString: string): Date => {
	// 添加本地时间，避免UTC偏移
	return new Date(`${dateString}T00:00:00`);
};

/**
 * 创建本地时区的Date对象
 * 从 YYYY-MM-DDTHH:MM 字符串创建
 */
export const createLocalDateTime = (dateTimeString: string): Date => {
	return new Date(dateTimeString);
};

/**
 * 获取指定天数前/后的本地日期
 * @param days 天数，负数表示之前的日期
 */
export const getLocalDateOffset = (days: number): string => {
	const now = new Date();
	const offsetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
	return formatDateToLocal(offsetDate);
};

/**
 * 比较两个日期字符串（本地时区）
 * 返回: -1(date1 < date2), 0(相等), 1(date1 > date2)
 */
export const compareDates = (date1: string, date2: string): number => {
	const d1 = createLocalDate(date1);
	const d2 = createLocalDate(date2);
	
	if (d1.getTime() < d2.getTime()) return -1;
	if (d1.getTime() > d2.getTime()) return 1;
	return 0;
};

/**
 * 检查日期是否是今天（本地时区）
 */
export const isToday = (dateString: string): boolean => {
	const today = getCurrentLocalDate();
	return dateString === today;
};

/**
 * 检查日期是否是昨天（本地时区）
 */
export const isYesterday = (dateString: string): boolean => {
	const yesterday = getLocalDateOffset(-1);
	return dateString === yesterday;
};

/**
 * 检查日期是否是明天（本地时区）
 */
export const isTomorrow = (dateString: string): boolean => {
	const tomorrow = getLocalDateOffset(1);
	return dateString === tomorrow;
};