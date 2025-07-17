import React from "react";

interface NavigationProps {
	currentPage: string;
	onNavigate: (page: string) => void;
	onLogout: () => void;
	onLoginRequired: () => void;
	isAuthenticated: boolean;
}
const Navigation = ({ currentPage, onNavigate, onLogout, onLoginRequired, isAuthenticated }: NavigationProps) => {
	const menuItems = [
		{ key: "food-search", label: "搜索食物", icon: "🔍", requiresAuth: false },
		{ key: "dashboard", label: "我的首页", icon: "🏠", requiresAuth: true },
		{ key: "statistics", label: "数据统计", icon: "📊", requiresAuth: true },
		{ key: "profile", label: "个人资料", icon: "👤", requiresAuth: true },
		{ key: "api-test", label: "API测试", icon: "🧪", requiresAuth: false },
	];
	return (
		<nav className="navigation">
			<div className="nav-brand">卡路里追踪器</div>

			<ul className="nav-menu">
				{menuItems.map((item) => (
					<li 
						key={item.key} 
						className={`nav-item ${currentPage === item.key ? "active" : ""} ${item.requiresAuth && !isAuthenticated ? "disabled" : ""}`} 
						onClick={() => {
							if (item.requiresAuth && !isAuthenticated) {
								onLoginRequired();
							} else {
								onNavigate(item.key);
							}
						}}
					>
						<span className="nav-icon">{item.icon}</span>
						<span className="nav-label">{item.label}</span>
						{item.requiresAuth && !isAuthenticated && <span className="auth-required">🔒</span>}
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
