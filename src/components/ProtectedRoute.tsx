import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner">验证身份中...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="unauthorized-container">
				<div className="unauthorized-message">
					<h2>访问受限</h2>
					<p>请先登录以访问此页面</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

export default ProtectedRoute;