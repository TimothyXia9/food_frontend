import React, { useState } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import LoginModal from "./components/LoginModal";
import Dashboard from "./pages/Dashboard";
import FoodSearch from "./pages/FoodSearch";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import ApiTest from "./pages/ApiTest";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

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
			return <FoodSearch onLoginRequired={handleLoginRequired} />;
		case "dashboard":
			return <Dashboard onLoginRequired={handleLoginRequired} />;
		case "profile":
			return <Profile onLoginRequired={handleLoginRequired} />;
		case "statistics":
			return <Statistics onLoginRequired={handleLoginRequired} />;
		case "api-test":
			return <ApiTest onLoginRequired={handleLoginRequired} />;
		default:
			return <FoodSearch onLoginRequired={handleLoginRequired} />;
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
			<main className="main-content">
				{renderPage()}
			</main>
			<LoginModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				onSuccess={() => setShowLoginModal(false)}
			/>
		</div>
	);
}

function App() {
	return (
		<AuthProvider>
			<NotificationProvider>
				<AppContent />
			</NotificationProvider>
		</AuthProvider>
	);
}

export default App;
