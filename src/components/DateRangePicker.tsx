import React, { useState, useRef, useEffect } from "react";
import "./DateRangePicker.css";
import { getCurrentLocalDate, getLocalDateOffset, isToday, isYesterday, isTomorrow, createLocalDate, formatDateToLocal } from "../utils/timezone";

interface DateRangePickerProps {
	startDate: string; // ISO date string (YYYY-MM-DD)
	endDate: string; // ISO date string (YYYY-MM-DD)
	onStartDateChange: (date: string) => void;
	onEndDateChange: (date: string) => void;
	isSingleMode: boolean;
	onModeChange: (isSingle: boolean) => void;
	onApply?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	isSingleMode,
	onModeChange,
	onApply
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectionStep, setSelectionStep] = useState<"start" | "end">("start");
	const [tempStartDate, setTempStartDate] = useState<string>(startDate);
	const [tempEndDate, setTempEndDate] = useState<string>(endDate);
	const containerRef = useRef<HTMLDivElement>(null);

	// Initialize temp dates when props change
	useEffect(() => {
		setTempStartDate(startDate);
		setTempEndDate(endDate);
	}, [startDate, endDate]);

	// Jump to selected date's month when picker opens
	useEffect(() => {
		if (isOpen && startDate) {
			const selectedDateObj = new Date(startDate);
			setCurrentMonth(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1));
		}
	}, [isOpen, startDate]);

	// Close popup when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Helper function to format date to local date string (YYYY-MM-DD)
	const formatLocalDate = (date: Date) => {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Format display value
	const formatDisplayValue = () => {
		if (isSingleMode) {
			return formatSingleDate(startDate);
		} else {
			return `${formatSingleDate(startDate)} - ${formatSingleDate(endDate)}`;
		}
	};

	const formatSingleDate = (dateStr: string) => {
		if (!dateStr) return "";

		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);

		const todayStr = formatLocalDate(today);
		const yesterdayStr = formatLocalDate(yesterday);
		const tomorrowStr = formatLocalDate(tomorrow);

		// Check if it's today, yesterday, or tomorrow
		if (dateStr === todayStr) {
			return "今天";
		} else if (dateStr === yesterdayStr) {
			return "昨天";
		} else if (dateStr === tomorrowStr) {
			return "明天";
		} else {
			// Format as MM-DD if same year, otherwise YYYY-MM-DD
			const currentYear = today.getFullYear();
			const selectedDateObj = new Date(`${dateStr}T00:00:00`);
			const selectedYear = selectedDateObj.getFullYear();

			if (selectedYear === currentYear) {
				const month = (selectedDateObj.getMonth() + 1).toString().padStart(2, "0");
				const day = selectedDateObj.getDate().toString().padStart(2, "0");
				return `${month}-${day}`;
			} else {
				return `${selectedYear}-${(selectedDateObj.getMonth() + 1).toString().padStart(2, "0")}-${selectedDateObj.getDate().toString().padStart(2, "0")}`;
			}
		}
	};

	// Get calendar days for current month
	const getCalendarDays = () => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);
		const firstDayOfWeek = firstDayOfMonth.getDay();
		const daysInMonth = lastDayOfMonth.getDate();

		const days = [];

		// Add empty cells for days before the first day of month
		for (let i = 0; i < firstDayOfWeek; i++) {
			const prevDate = new Date(year, month, -(firstDayOfWeek - 1 - i));
			days.push({
				date: prevDate.getDate(),
				isCurrentMonth: false,
				isToday: false,
				isSelected: false,
				isInRange: false,
				isRangeStart: false,
				isRangeEnd: false,
				fullDate: formatLocalDate(prevDate)
			});
		}

		// Add days of current month
		const today = new Date();
		const todayStr = formatLocalDate(today);

		for (let day = 1; day <= daysInMonth; day++) {
			const dateObj = new Date(year, month, day);
			const dateStr = formatLocalDate(dateObj);
			
			const isStart = dateStr === tempStartDate;
			const isEnd = dateStr === tempEndDate;
			const isInRange = !isSingleMode && tempStartDate && tempEndDate && 
				dateStr >= tempStartDate && dateStr <= tempEndDate;

			days.push({
				date: day,
				isCurrentMonth: true,
				isToday: dateStr === todayStr,
				isSelected: isSingleMode ? dateStr === tempStartDate : (isStart || isEnd),
				isInRange: isInRange && !isStart && !isEnd,
				isRangeStart: isStart,
				isRangeEnd: isEnd,
				fullDate: dateStr
			});
		}

		// Add days from next month to fill the grid
		const remainingCells = 42 - days.length; // 6 rows * 7 days
		for (let day = 1; day <= remainingCells; day++) {
			const nextDate = new Date(year, month + 1, day);
			days.push({
				date: day,
				isCurrentMonth: false,
				isToday: false,
				isSelected: false,
				isInRange: false,
				isRangeStart: false,
				isRangeEnd: false,
				fullDate: formatLocalDate(nextDate)
			});
		}

		return days;
	};

	// Navigate to previous month
	const goToPreviousMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
	};

	// Navigate to next month
	const goToNextMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
	};

	// Handle date selection from calendar
	const handleCalendarDateSelect = (dateStr: string) => {
		if (isSingleMode) {
			setTempStartDate(dateStr);
			setTempEndDate(dateStr);
		} else {
			if (selectionStep === "start") {
				setTempStartDate(dateStr);
				setTempEndDate(dateStr);
				setSelectionStep("end");
			} else {
				// Handle end date selection
				let newStartDate = tempStartDate;
				let newEndDate = dateStr;
				
				// Auto-swap if end date is earlier than start date
				if (newEndDate < newStartDate) {
					[newStartDate, newEndDate] = [newEndDate, newStartDate];
				}
				
				setTempStartDate(newStartDate);
				setTempEndDate(newEndDate);
				setSelectionStep("start");
			}
		}
	};

	// Handle mode change
	const handleModeChange = (isSingle: boolean) => {
		onModeChange(isSingle);
		if (isSingle) {
			setTempEndDate(tempStartDate);
		}
		setSelectionStep("start");
	};

	// Apply changes and close
	const handleApply = () => {
		onStartDateChange(tempStartDate);
		onEndDateChange(tempEndDate);
		setIsOpen(false);
		if (onApply) {
			onApply();
		}
	};


	// Quick selection handlers
	const handleQuickSelect = (type: "week" | "month") => {
		const today = new Date();
		let start: Date;
		let end: Date;

		if (type === "week") {
			// 今天以前的7天（包括今天）
			end = new Date(today);
			start = new Date(today);
			start.setDate(today.getDate() - 6); // 7天前
		} else {
			// 今天以前的30天（包括今天）
			end = new Date(today);
			start = new Date(today);
			start.setDate(today.getDate() - 29); // 30天前
		}

		const startStr = formatLocalDate(start);
		const endStr = formatLocalDate(end);

		setTempStartDate(startStr);
		setTempEndDate(endStr);
		
		// Switch to multi-day mode if not already
		if (isSingleMode) {
			onModeChange(false);
		}
		
		setSelectionStep("start");
	};

	return (
		<div className="date-range-picker" ref={containerRef}>
			<div
				className="date-range-picker-trigger"
				onClick={() => setIsOpen(!isOpen)}
			>
				<span className="date-range-value">{formatDisplayValue()}</span>
				<svg className="date-range-picker-icon" width="16" height="16" viewBox="0 0 16 16">
					<path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1H2zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5z" />
				</svg>
			</div>

			{isOpen && (
				<div className="date-range-picker-popup">
					<div className="date-range-picker-header">
						<h3>选择统计时间</h3>
						<div className="mode-toggle">
							<button 
								type="button"
								className={`mode-btn ${isSingleMode ? "active" : ""}`}
								onClick={() => handleModeChange(true)}
							>
								单日
							</button>
							<button 
								type="button"
								className={`mode-btn ${!isSingleMode ? "active" : ""}`}
								onClick={() => handleModeChange(false)}
							>
								多日
							</button>
						</div>
					</div>

					<div className="date-range-picker-content">
						{/* Quick Selection Buttons */}
						{!isSingleMode && (
							<div className="quick-select-section">
								<label className="section-label">快速选择</label>
								<div className="quick-select-buttons">
									<button 
										type="button"
										className="quick-select-btn"
										onClick={() => handleQuickSelect("week")}
									>
										前一周
									</button>
									<button 
										type="button"
										className="quick-select-btn"
										onClick={() => handleQuickSelect("month")}
									>
										前一个月
									</button>
								</div>
							</div>
						)}

						{/* Calendar Section */}
						<div className="calendar-section">
							<label className="section-label">
								{isSingleMode ? "选择日期" : 
									selectionStep === "start" ? "选择开始日期" : "选择结束日期"
								}
							</label>

							{/* Calendar Header */}
							<div className="calendar-header">
								<button
									type="button"
									className="nav-btn"
									onClick={goToPreviousMonth}
								>
									<svg width="16" height="16" viewBox="0 0 16 16">
										<path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
									</svg>
								</button>

								<span className="month-year">
									{currentMonth.getFullYear()}年{(currentMonth.getMonth() + 1).toString().padStart(2, "0")}月
								</span>

								<button
									type="button"
									className="nav-btn"
									onClick={goToNextMonth}
								>
									<svg width="16" height="16" viewBox="0 0 16 16">
										<path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
									</svg>
								</button>
							</div>

							{/* Week Days Header */}
							<div className="weekdays">
								<div className="weekday">日</div>
								<div className="weekday">一</div>
								<div className="weekday">二</div>
								<div className="weekday">三</div>
								<div className="weekday">四</div>
								<div className="weekday">五</div>
								<div className="weekday">六</div>
							</div>

							{/* Calendar Grid */}
							<div className="calendar-grid">
								{getCalendarDays().map((day, index) => (
									<button
										key={index}
										type="button"
										className={`calendar-day ${day.isCurrentMonth ? "current-month" : "other-month"
										} ${day.isToday ? "today" : ""
										} ${day.isSelected ? "selected" : ""
										} ${day.isInRange ? "in-range" : ""
										} ${day.isRangeStart ? "range-start" : ""
										} ${day.isRangeEnd ? "range-end" : ""
										}`}
										onClick={() => handleCalendarDateSelect(day.fullDate)}
									>
										{day.date}
									</button>
								))}
							</div>
						</div>

						{/* Selection Status */}
						{!isSingleMode && (
							<div className="selection-status">
								<div className="status-item">
									<span className="status-label">开始日期:</span>
									<span className="status-value">{formatSingleDate(tempStartDate)}</span>
								</div>
								<div className="status-item">
									<span className="status-label">结束日期:</span>
									<span className="status-value">{formatSingleDate(tempEndDate)}</span>
								</div>
								<div className="status-hint">
									{selectionStep === "start" ? "点击日历选择开始日期" : "点击日历选择结束日期"}
								</div>
							</div>
						)}
					</div>

					<div className="date-range-picker-footer">
						<button
							type="button"
							className="cancel-btn"
							onClick={() => setIsOpen(false)}
						>
							取消
						</button>
						<button
							type="button"
							className="apply-btn"
							onClick={handleApply}
						>
							应用
						</button>
					</div>
				</div>
			)}
		</div>
	);
};