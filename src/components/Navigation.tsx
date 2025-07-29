import React from "react";
import { Link, useLocation } from "react-router-dom";
import { trackPageView } from "../utils/analytics";

interface NavigationProps {
	onLogout: () => void;
	onLoginRequired: () => void;
	isAuthenticated: boolean;
}
const Navigation = ({ onLogout, onLoginRequired, isAuthenticated }: NavigationProps) => {
	const location = useLocation();

	const menuItems = [
		{ path: "/dashboard", label: "我的首页", icon: "🏠", requiresAuth: true },
		{ path: "/", label: "搜索食物", icon: "🔍", requiresAuth: false },
		{ path: "/statistics", label: "每餐统计", icon: "📊", requiresAuth: true },
		{ path: "/profile", label: "个人资料", icon: "👤", requiresAuth: true },
		{ path: "/api-test", label: "API测试", icon: "🧪", requiresAuth: false },
		{ path: "/token-test", label: "Token测试", icon: "🔑", requiresAuth: false },
	];

	const handleNavClick = (path: string, requiresAuth: boolean) => {
		if (requiresAuth && !isAuthenticated) {
			onLoginRequired();
		} else {
			trackPageView(path);
		}
	};

	return (
		<nav className="navigation">
			<div className="nav-brand">卡路里追踪器</div>

			<ul className="nav-menu">
				{menuItems.map(item => (
					<li
						key={item.path}
						className={`nav-item ${location.pathname === item.path ? "active" : ""} ${item.requiresAuth && !isAuthenticated ? "disabled" : ""}`}
					>
						{item.requiresAuth && !isAuthenticated ? (
							<span
								className="nav-link disabled"
								onClick={() => handleNavClick(item.path, item.requiresAuth)}
							>
								<span className="nav-icon">{item.icon}</span>
								<span className="nav-label">{item.label}</span>
								<span className="auth-required"></span>
							</span>
						) : (
							<Link
								to={item.path}
								className="nav-link"
								onClick={() => handleNavClick(item.path, item.requiresAuth)}
							>
								<span className="nav-icon">{item.icon}</span>
								<span className="nav-label">{item.label}</span>
							</Link>
						)}
					</li>
				))}
			</ul>

			<div className="nav-user">
				{isAuthenticated ? (
					<button className="logout-btn" onClick={onLogout}>
						登出
					</button>
				) : (
					<button className="login-btn" onClick={onLoginRequired}>
						登录
					</button>
				)}
			</div>
		</nav>
	);
};
export default Navigation;
