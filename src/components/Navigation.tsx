import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavigationProps {
	onLogout: () => void;
	onLoginRequired: () => void;
	isAuthenticated: boolean;
}
const Navigation = ({
	onLogout,
	onLoginRequired,
	isAuthenticated,
}: NavigationProps) => {
	const location = useLocation();
	const { t } = useTranslation();

	const menuItems = [
		{
			path: "/dashboard",
			label: t("navigation.dashboard"),
			icon: "🏠",
			requiresAuth: true,
		},
		{
			path: "/",
			label: t("navigation.foodSearch"),
			icon: "🔍",
			requiresAuth: false,
		},
		{
			path: "/statistics",
			label: t("navigation.statistics"),
			icon: "📊",
			requiresAuth: true,
		},
		{
			path: "/profile",
			label: t("navigation.profile"),
			icon: "👤",
			requiresAuth: true,
		},
		{
			path: "/api-test",
			label: t("navigation.apiTest"),
			icon: "🧪",
			requiresAuth: false,
		},
		{ path: "/token-test", label: "Token Test", icon: "🔑", requiresAuth: false },
	];

	const handleNavClick = (
		path: string,
		requiresAuth: boolean,
		e?: React.MouseEvent
	) => {
		if (requiresAuth && !isAuthenticated) {
			// 阻止导航，显示登录模态框
			e?.preventDefault();
			onLoginRequired();
		} else {
			// 正常导航
			window.scrollTo(0, 0);
		}
	};

	return (
		<nav className="navigation">
			<div className="nav-brand">{t("common.name", "Calorie Tracker")}</div>

			<ul className="nav-menu">
				{menuItems.map(item => (
					<li
						key={item.path}
						className={`nav-item ${location.pathname === item.path ? "active" : ""} ${item.requiresAuth && !isAuthenticated ? "disabled" : ""}`}
					>
						{item.requiresAuth && !isAuthenticated ? (
							<span
								className="nav-link disabled"
								onClick={e => handleNavClick(item.path, item.requiresAuth, e)}
							>
								<span className="nav-icon">{item.icon}</span>
								<span className="nav-label">{item.label}</span>
								<span className="auth-required">🔒</span>
							</span>
						) : (
							<Link
								to={item.path}
								className="nav-link"
								onClick={e => handleNavClick(item.path, item.requiresAuth, e)}
							>
								<span className="nav-icon">{item.icon}</span>
								<span className="nav-label">{item.label}</span>
							</Link>
						)}
					</li>
				))}
			</ul>

			<div className="nav-user">
				<LanguageSwitcher className="language-switcher-nav" />
				{isAuthenticated ? (
					<button className="logout-btn" onClick={onLogout}>
						{t("navigation.logout")}
					</button>
				) : (
					<button className="login-btn" onClick={onLoginRequired}>
						{t("navigation.login")}
					</button>
				)}
			</div>
		</nav>
	);
};
export default Navigation;
