import React from "react";
import Notification, { NotificationProps } from "./Notification";
import "./NotificationContainer.css";

interface NotificationContainerProps {
	notifications: Omit<NotificationProps, "onClose">[];
	onClose: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
	notifications,
	onClose,
}) => {
	if (notifications.length === 0) {
		return null;
	}

	return (
		<div className="notification-container">
			{notifications.map((notification) => (
				<Notification
					key={notification.id}
					{...notification}
					onClose={onClose}
				/>
			))}
		</div>
	);
};

export default NotificationContainer;