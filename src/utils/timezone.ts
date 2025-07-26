/**
 * 统一的时区处理工具函数
 * 原则：后端只存储UTC时间，前端负责本地时区转换
 */

/**
 * 将UTC时间字符串转换为本地Date对象用于显示
 * @param utcTimeString - UTC时间字符串，如 "2025-07-19T15:30:00Z"
 * @returns 本地时区的Date对象
 */
export const utcToLocal = (utcTimeString: string): Date => {
	if (!utcTimeString) return new Date();

	// 确保UTC时间字符串正确解析
	let timeStr = utcTimeString;
	if (!timeStr.endsWith("Z") && !timeStr.includes("+") && !timeStr.includes("-", 10)) {
		timeStr += "Z";
	}
	return new Date(timeStr);
};

/**
 * 将本地时间转换为UTC时间字符串发送给后端
 * @param localDateTime - 本地时间的Date对象或时间字符串
 * @returns UTC时间字符串，如 "2025-07-19T15:30:00.000Z"
 */
export const localToUTC = (localDateTime: Date | string): string => {
	const date = typeof localDateTime === "string" ? new Date(localDateTime) : localDateTime;
	return date.toISOString();
};

/**
 * 获取当前本地时间的日期字符串（YYYY-MM-DD）
 * 用于日期选择器等组件
 */
export const getCurrentLocalDate = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, "0");
	const day = now.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * 获取当前本地时间的日期时间字符串（YYYY-MM-DDTHH:MM）
 * 用于日期时间选择器
 */
export const getCurrentLocalDateTime = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, "0");
	const day = now.getDate().toString().padStart(2, "0");
	const hours = now.getHours().toString().padStart(2, "0");
	const minutes = now.getMinutes().toString().padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * 创建本地时间的Date对象（从YYYY-MM-DDTHH:MM字符串）
 * 主要用于处理用户输入的时间
 */
export const createLocalDateTime = (dateTimeString: string): Date => {
	return new Date(dateTimeString);
};

/**
 * 格式化UTC时间为本地时间显示
 * @param utcTimeString - UTC时间字符串
 * @param options - 格式化选项
 * @returns 格式化后的本地时间字符串
 */
export const formatUTCToLocal = (
	utcTimeString: string,
	options?: Intl.DateTimeFormatOptions
): string => {
	const localDate = utcToLocal(utcTimeString);
	return localDate.toLocaleString("zh-CN", options);
};

/**
 * 格式化UTC日期为本地日期显示
 * @param utcTimeString - UTC时间字符串
 * @returns 格式化后的本地日期字符串，如 "2025/7/19"
 */
export const formatUTCDateToLocal = (utcTimeString: string): string => {
	const localDate = utcToLocal(utcTimeString);
	return localDate.toLocaleDateString("zh-CN");
};

/**
 * 格式化UTC时间为本地时间显示（仅时间部分）
 * @param utcTimeString - UTC时间字符串
 * @returns 格式化后的本地时间字符串，如 "15:30"
 */
export const formatUTCTimeToLocal = (utcTimeString: string): string => {
	const localDate = utcToLocal(utcTimeString);
	return localDate.toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * 获取指定天数前/后的本地日期
 * @param days 天数，负数表示之前的日期
 */
export const getLocalDateOffset = (days: number): string => {
	const now = new Date();
	const offsetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
	const year = offsetDate.getFullYear();
	const month = (offsetDate.getMonth() + 1).toString().padStart(2, "0");
	const day = offsetDate.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * 创建本地日期对象（避免时区偏移）
 * @param dateString YYYY-MM-DD格式的日期字符串
 */
export const createLocalDate = (dateString: string): Date => {
	return new Date(`${dateString}T00:00:00`);
};

/**
 * 将本地日期转换为 UTC 时间范围（用于查询）
 * @param dateString YYYY-MM-DD格式的本地日期字符串
 * @returns { start_datetime_utc: string, end_datetime_utc: string }
 */
export const localDateToUTCRange = (
	dateString: string
): { start_datetime_utc: string; end_datetime_utc: string } => {
	// 创建本地日期的开始和结束时间
	const startLocal = new Date(`${dateString}T00:00:00`);
	const endLocal = new Date(`${dateString}T23:59:59`);

	// 转换为 UTC
	return {
		start_datetime_utc: localToUTC(startLocal),
		end_datetime_utc: localToUTC(endLocal),
	};
};

/**
 * 将本地日期范围转换为 UTC 时间范围（用于查询）
 * @param startDate YYYY-MM-DD格式的开始日期
 * @param endDate YYYY-MM-DD格式的结束日期
 * @returns { start_datetime_utc: string, end_datetime_utc: string }
 */
export const localDateRangeToUTCRange = (
	startDate: string,
	endDate: string
): { start_datetime_utc: string; end_datetime_utc: string } => {
	// 创建本地日期范围
	const startLocal = new Date(`${startDate}T00:00:00`);
	const endLocal = new Date(`${endDate}T23:59:59`);

	// 转换为 UTC
	return {
		start_datetime_utc: localToUTC(startLocal),
		end_datetime_utc: localToUTC(endLocal),
	};
};
