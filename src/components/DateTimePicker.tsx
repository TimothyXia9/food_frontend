import React, { useState, useRef, useEffect } from "react";
import "./DateTimePicker.css";
import {
	getCurrentLocalDate,
	getCurrentLocalDateTime,
	createLocalDate,
} from "../utils/timezone";
import { useTranslation } from "react-i18next";

interface DateTimePickerProps {
	value: string; // ISO datetime string (YYYY-MM-DDTHH:mm)
	onChange: (value: string) => void;
	placeholder?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
	value,
	onChange,
	placeholder,
}) => {
	const { t } = useTranslation();

	// 格式化年月显示
	const formatMonthYear = (date: Date): string => {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const format = t("dateTime.monthYearFormat.format");

		return format
			.replace("YYYY", year.toString())
			.replace("MM", month.toString().padStart(2, "0"))
			.replace("M", month.toString());
	};

	// 本地工具函数
	const formatDateToLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const isToday = (dateStr: string): boolean => {
		const today = getCurrentLocalDate();
		return dateStr === today;
	};

	const isYesterday = (dateStr: string): boolean => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return dateStr === formatDateToLocal(yesterday);
	};

	const isTomorrow = (dateStr: string): boolean => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return dateStr === formatDateToLocal(tomorrow);
	};
	const [isOpen, setIsOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedTime, setSelectedTime] = useState<string>("");
	const [timeInput, setTimeInput] = useState<string>("");
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const containerRef = useRef<HTMLDivElement>(null);

	// Helper function to format date to local date string (YYYY-MM-DD)
	const formatLocalDate = (date: Date) => {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Helper function to format time to local time string (HH:MM)
	const formatLocalTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	};

	// Initialize date and time from value
	useEffect(() => {
		if (value) {
			const date = new Date(value);
			const dateStr = formatLocalDate(date);
			const timeStr = formatLocalTime(date);
			setSelectedDate(dateStr);
			setSelectedTime(timeStr);
			setTimeInput(formatTimeForDisplay(timeStr));
			// Set current month to the month of the selected date
			setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
		} else {
			// Default to current date and time in local timezone
			const now = new Date();
			const dateStr = formatLocalDate(now);
			const timeStr = formatLocalTime(now);
			setSelectedDate(dateStr);
			setSelectedTime(timeStr);
			setTimeInput(formatTimeForDisplay(timeStr));
			setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
			// Update parent with current date/time
			const currentDateTime = `${dateStr}T${timeStr}`;
			onChange(currentDateTime);
		}
	}, [value, onChange]);

	// Jump to selected date's month when picker opens
	useEffect(() => {
		if (isOpen && selectedDate) {
			const selectedDateObj = new Date(selectedDate);
			setCurrentMonth(
				new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
			);
		}
	}, [isOpen, selectedDate]);

	// Close popup when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Format display value
	const formatDisplayValue = () => {
		if (!selectedDate || !selectedTime) return placeholder;

		const dateStr = selectedDate;
		const timeStr = selectedTime;

		// Use timezone utility functions for accurate date checking
		if (isToday(dateStr)) {
			return `${t("dateTime.today")} ${timeStr}`;
		} else if (isYesterday(dateStr)) {
			return `${t("dateTime.yesterday")} ${timeStr}`;
		} else if (isTomorrow(dateStr)) {
			return `${t("dateTime.tomorrow")} ${timeStr}`;
		} else {
			// Format as MM-DD if same year, otherwise YYYY-MM-DD
			const currentYear = new Date().getFullYear();
			const selectedDateObj = createLocalDate(dateStr);
			const selectedYear = selectedDateObj.getFullYear();

			if (selectedYear === currentYear) {
				const month = (selectedDateObj.getMonth() + 1).toString().padStart(2, "0");
				const day = selectedDateObj.getDate().toString().padStart(2, "0");
				return `${month}-${day} ${timeStr}`;
			} else {
				return `${selectedYear}-${(selectedDateObj.getMonth() + 1).toString().padStart(2, "0")}-${selectedDateObj.getDate().toString().padStart(2, "0")} ${timeStr}`;
			}
		}
	};

	// Handle date change
	const handleDateChange = (newDate: string) => {
		setSelectedDate(newDate);
		const newDateTime = `${newDate}T${selectedTime}`;
		onChange(newDateTime);
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
				fullDate: formatLocalDate(prevDate),
			});
		}

		// Add days of current month
		const today = new Date();
		const todayStr = formatLocalDate(today);

		for (let day = 1; day <= daysInMonth; day++) {
			const dateObj = new Date(year, month, day);
			const dateStr = formatLocalDate(dateObj);

			days.push({
				date: day,
				isCurrentMonth: true,
				isToday: dateStr === todayStr,
				isSelected: dateStr === selectedDate,
				fullDate: dateStr,
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
				fullDate: formatLocalDate(nextDate),
			});
		}

		return days;
	};

	// Navigate to previous month
	const goToPreviousMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
		);
	};

	// Navigate to next month
	const goToNextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
		);
	};

	// Handle date selection from calendar
	const handleCalendarDateSelect = (dateStr: string) => {
		handleDateChange(dateStr);
	};

	// Format time for display (24h to 12h with AM/PM or keep 24h)
	const formatTimeForDisplay = (time24: string) => {
		return time24; // For now, keep 24h format
	};

	// Parse various time input formats
	const parseTimeInput = (input: string): string | null => {
		// Remove spaces and convert to lowercase
		const cleanInput = input.replace(/\s+/g, "").toLowerCase();

		// Match different time formats
		const patterns = [
			// 24-hour format: 14:30, 14.30, 1430
			/^(\d{1,2})[:.h]?(\d{2})$/,
			// 12-hour format: 2:30pm, 2.30pm, 230pm
			/^(\d{1,2})[:.h]?(\d{2})(am|pm)$/,
			// Hour only: 14, 14h, 2pm
			/^(\d{1,2})(h|am|pm)?$/,
			// Shortcuts: noon, midnight
			/^(noon|midnight)$/,
		];

		// Handle special cases
		if (cleanInput === "noon" || cleanInput === "12pm") {
			return "12:00";
		}
		if (cleanInput === "midnight" || cleanInput === "12am") {
			return "00:00";
		}

		// Try each pattern
		for (const pattern of patterns) {
			const match = cleanInput.match(pattern);
			if (match) {
				if (match[3]) {
					// 12-hour format with AM/PM
					let hour = parseInt(match[1]);
					const minute = match[2] || "00";
					const period = match[3];

					if (period === "pm" && hour !== 12) hour += 12;
					if (period === "am" && hour === 12) hour = 0;

					return `${hour.toString().padStart(2, "0")}:${minute}`;
				} else if (match[2]) {
					// 24-hour format with minutes
					const hour = parseInt(match[1]);
					const minute = match[2];

					if (
						hour >= 0 &&
						hour <= 23 &&
						parseInt(minute) >= 0 &&
						parseInt(minute) <= 59
					) {
						return `${hour.toString().padStart(2, "0")}:${minute}`;
					}
				} else {
					// Hour only
					let hour = parseInt(match[1]);
					const hasAmPm = match[2] && (match[2] === "am" || match[2] === "pm");

					if (hasAmPm) {
						if (match[2] === "pm" && hour !== 12) hour += 12;
						if (match[2] === "am" && hour === 12) hour = 0;
					}

					if (hour >= 0 && hour <= 23) {
						return `${hour.toString().padStart(2, "0")}:00`;
					}
				}
			}
		}

		return null; // Invalid input
	};

	// Handle time input change
	const handleTimeInputChange = (input: string) => {
		setTimeInput(input);
	};

	// Handle time input blur (when user finishes typing)
	const handleTimeInputBlur = () => {
		const parsedTime = parseTimeInput(timeInput);
		if (parsedTime) {
			setSelectedTime(parsedTime);
			setTimeInput(formatTimeForDisplay(parsedTime));
			const newDateTime = `${selectedDate}T${parsedTime}`;
			onChange(newDateTime);
		} else {
			// Reset to previous valid time if invalid
			setTimeInput(formatTimeForDisplay(selectedTime));
		}
	};

	// Handle Enter key press
	const handleTimeInputKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleTimeInputBlur();
		}
	};

	return (
		<div className="datetime-picker" ref={containerRef}>
			<div className="datetime-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
				<span className="datetime-value">{formatDisplayValue()}</span>
				<svg
					className="datetime-picker-icon"
					width="16"
					height="16"
					viewBox="0 0 16 16"
				>
					<path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1H2zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5z" />
				</svg>
			</div>

			{isOpen && (
				<div className="datetime-picker-popup">
					<div className="datetime-picker-header">
						<h3>选择日期和时间</h3>
					</div>

					<div className="datetime-picker-content">
						{/* Custom Calendar */}
						<div className="calendar-section">
							<label className="section-label">选择日期</label>

							{/* Calendar Header */}
							<div className="calendar-header">
								<button type="button" className="nav-btn" onClick={goToPreviousMonth}>
									<svg width="16" height="16" viewBox="0 0 16 16">
										<path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
									</svg>
								</button>

								<span className="month-year">{formatMonthYear(currentMonth)}</span>

								<button type="button" className="nav-btn" onClick={goToNextMonth}>
									<svg width="16" height="16" viewBox="0 0 16 16">
										<path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
									</svg>
								</button>
							</div>

							{/* Week Days Header */}
							<div className="weekdays">
								<div className="weekday">{t("dateTime.weekdays.sun")}</div>
								<div className="weekday">{t("dateTime.weekdays.mon")}</div>
								<div className="weekday">{t("dateTime.weekdays.tue")}</div>
								<div className="weekday">{t("dateTime.weekdays.wed")}</div>
								<div className="weekday">{t("dateTime.weekdays.thu")}</div>
								<div className="weekday">{t("dateTime.weekdays.fri")}</div>
								<div className="weekday">{t("dateTime.weekdays.sat")}</div>
							</div>

							{/* Calendar Grid */}
							<div className="calendar-grid">
								{getCalendarDays().map((day, index) => (
									<button
										key={index}
										type="button"
										className={`calendar-day ${
											day.isCurrentMonth ? "current-month" : "other-month"
										} ${day.isToday ? "today" : ""} ${day.isSelected ? "selected" : ""}`}
										onClick={() => handleCalendarDateSelect(day.fullDate)}
									>
										{day.date}
									</button>
								))}
							</div>
						</div>

						{/* Time Selection */}
						<div className="time-section">
							<label className="section-label">{t("dateTime.selectTime")}</label>

							{/* Direct Time Input */}
							<div className="time-input-container">
								<input
									type="text"
									value={timeInput}
									onChange={e => handleTimeInputChange(e.target.value)}
									onBlur={handleTimeInputBlur}
									onKeyDown={handleTimeInputKeyPress}
									placeholder={t("dateTime.timeInputPlaceholder")}
									className="time-text-input"
								/>
							</div>
						</div>
					</div>

					<div className="datetime-picker-footer">
						<button className="confirm-btn" onClick={() => setIsOpen(false)}>
							{t("dateTime.confirm")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
