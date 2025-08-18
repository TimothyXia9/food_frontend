import React, { useEffect } from "react";
import "./Notification.css";

export interface NotificationProps {
	id: string;
	type: "success" | "error" | "warning" | "info";
	message: string;
	duration?: number;
	count?: number;
	onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
	id,
	type,
	message,
	duration = 3000,
	count,
	onClose,
}) => {
	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				onClose(id);
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [id, duration, onClose]);

	const getIcon = () => {
		switch (type) {
			case "success":
				return "✓";
			case "error":
				return "✕";
			case "warning":
				return "⚠";
			case "info":
				return "ℹ";
			default:
				return "ℹ";
		}
	};

	const handleClick = () => {
		onClose(id);
	};

	return (
		<div className={`notification notification--${type}`} onClick={handleClick}>
			<div className="notification__content">
				<span className="notification__icon">{getIcon()}</span>
				<span className="notification__message">
					{message}
					{count && count > 1 && (
						<span className="notification__count"> ({count})</span>
					)}
				</span>
				<button
					className="notification__close"
					onClick={handleClick}
					aria-label="关闭通知"
				>
					×
				</button>
			</div>
		</div>
	);
};

export default Notification;
