import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import NotificationContainer from "../components/NotificationContainer";
import "./NotificationContext.css";

export interface NotificationData {
	id: string;
	type: "success" | "error" | "warning" | "info";
	message: string;
	duration?: number;
	count?: number; // 用于显示重复次数
}

interface NotificationContextType {
	addNotification: (notification: Omit<NotificationData, "id">) => void;
	removeNotification: (id: string) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
	showConfirm: (message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
	children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
	const [notifications, setNotifications] = useState<NotificationData[]>([]);
	const [confirmDialog, setConfirmDialog] = useState<{
		message: string;
		resolve: (value: boolean) => void;
			} | null>(null);

	const generateId = () =>
		`notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const addNotification = useCallback((notification: Omit<NotificationData, "id">) => {
		// 检查是否已有相同类型和消息的通知
		setNotifications(prev => {
			const existingIndex = prev.findIndex(
				n => n.type === notification.type && n.message === notification.message
			);

			if (existingIndex !== -1) {
				// 更新现有通知的计数和时间戳
				const updated = [...prev];
				updated[existingIndex] = {
					...updated[existingIndex],
					count: (updated[existingIndex].count || 1) + 1,
					id: generateId(), // 更新ID以触发重新渲染
				};
				return updated;
			} else {
				// 添加新通知
				const id = generateId();
				const newNotification: NotificationData = {
					...notification,
					id,
					count: 1,
				};
				return [...prev, newNotification];
			}
		});
	}, []);

	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(notification => notification.id !== id));
	}, []);

	const showSuccess = useCallback(
		(message: string, duration?: number) => {
			addNotification({ type: "success", message, duration });
		},
		[addNotification]
	);

	const showError = useCallback(
		(message: string, duration?: number) => {
			addNotification({ type: "error", message, duration });
		},
		[addNotification]
	);

	const showWarning = useCallback(
		(message: string, duration?: number) => {
			addNotification({ type: "warning", message, duration });
		},
		[addNotification]
	);

	const showInfo = useCallback(
		(message: string, duration?: number) => {
			addNotification({ type: "info", message, duration });
		},
		[addNotification]
	);

	const showConfirm = useCallback((message: string): Promise<boolean> => {
		return new Promise(resolve => {
			setConfirmDialog({ message, resolve });
		});
	}, []);

	const handleConfirmClose = useCallback(
		(confirmed: boolean) => {
			if (confirmDialog) {
				confirmDialog.resolve(confirmed);
				setConfirmDialog(null);
			}
		},
		[confirmDialog]
	);

	const contextValue: NotificationContextType = {
		addNotification,
		removeNotification,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		showConfirm,
	};

	return (
		<NotificationContext.Provider value={contextValue}>
			{children}
			<NotificationContainer notifications={notifications} onClose={removeNotification} />
			{confirmDialog && (
				<ConfirmDialog message={confirmDialog.message} onClose={handleConfirmClose} />
			)}
		</NotificationContext.Provider>
	);
};

// 确认对话框组件
interface ConfirmDialogProps {
	message: string;
	onClose: (confirmed: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onClose }) => {
	return (
		<div className="confirm-dialog-overlay">
			<div className="confirm-dialog">
				<div className="confirm-dialog__content">
					<p className="confirm-dialog__message">{message}</p>
					<div className="confirm-dialog__buttons">
						<button
							className="confirm-dialog__button confirm-dialog__button--cancel"
							onClick={() => onClose(false)}
						>
							取消
						</button>
						<button
							className="confirm-dialog__button confirm-dialog__button--confirm"
							onClick={() => onClose(true)}
						>
							确认
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export const useNotification = (): NotificationContextType => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error("useNotification must be used within a NotificationProvider");
	}
	return context;
};
