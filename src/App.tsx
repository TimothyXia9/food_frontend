import React, { useState } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import LoginModal from "./components/LoginModal";
import Dashboard from "./pages/Dashboard";
import FoodSearch from "./pages/FoodSearch";
import Profile from "./pages/Profile";
import MealStats from "./pages/MealStats";
import ApiTest from "./pages/ApiTest";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Analytics } from "@vercel/analytics/react";

function AppContent() {
	const [currentPage, setCurrentPage] = useState("food-search");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const { isAuthenticated, loading, logout } = useAuth();

	const handleLogout = async () => {
		await logout();
		setCurrentPage("food-search");
	};

	const handleLoginRequired = () => {
		setShowLoginModal(true);
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner">加载中...</div>
			</div>
		);
	}

	const renderPage = () => {
		switch (currentPage) {
			case "food-search":
				return (
					<FoodSearch onLoginRequired={handleLoginRequired} onNavigate={setCurrentPage} />
				);
			case "dashboard":
				return <Dashboard onLoginRequired={handleLoginRequired} />;
			case "meal-stats":
				return (
					<MealStats onLoginRequired={handleLoginRequired} onNavigate={setCurrentPage} />
				);
			case "profile":
				return <Profile onLoginRequired={handleLoginRequired} />;
			case "api-test":
				return <ApiTest onLoginRequired={handleLoginRequired} />;
			default:
				return (
					<FoodSearch onLoginRequired={handleLoginRequired} onNavigate={setCurrentPage} />
				);
		}
	};

	return (
		<div className="App">
			<Navigation
				currentPage={currentPage}
				onNavigate={setCurrentPage}
				onLogout={handleLogout}
				onLoginRequired={handleLoginRequired}
				isAuthenticated={isAuthenticated}
			/>
			<main className="main-content">{renderPage()}</main>
			<LoginModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				onSuccess={() => setShowLoginModal(false)}
			/>
		</div>
	);
}

function App() {
	// Enable analytics based on environment variable
	const enableAnalytics = process.env.REACT_APP_ENABLE_ANALYTICS === "true";

	return (
		<AuthProvider>
			<NotificationProvider>
				<AppContent />
				{enableAnalytics && <Analytics />}
			</NotificationProvider>
		</AuthProvider>
	);
}

export default App;
