import React from 'react';

interface NavigationProps {
	currentPage: string;
	onNavigate: (page: string) => void;
	onLogout: () => void;
}
const Navigation = ({ currentPage, onNavigate, onLogout }: NavigationProps) => {
	const menuItems = [
		{ key: 'dashboard', label: '首页', icon: '🏠' },
		{ key: 'food-search', label: '添加食物', icon: '🍎' },
		{ key: 'statistics', label: '统计', icon: '📊' },
		{ key: 'profile', label: '个人资料', icon: '👤' },
	];
	return (
		<nav className="navigation">
			<div className="nav-brand">卡路里追踪器</div>

			<ul className="nav-menu">
				{menuItems.map((item) => (
					<li key={item.key} className={`nav-item ${currentPage === item.key ? 'active' : ''}`} onClick={() => onNavigate(item.key)}>
						<span className="nav-icon">{item.icon}</span>
						<span className="nav-label">{item.label}</span>
					</li>
				))}
			</ul>

			<div className="nav-user">
				<button className="logout-btn" onClick={onLogout}>
					登出
				</button>
			</div>
		</nav>
	);
};
export default Navigation;
