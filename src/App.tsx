import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import LoginModal from "./components/LoginModal";
import Dashboard from "./pages/Dashboard";
import FoodSearch from "./pages/FoodSearch";
import Profile from "./pages/Profile";
import MealStats from "./pages/MealStats";
import ApiTest from "./pages/ApiTest";
import TokenTest from "./pages/TokenTest";
import EmailVerification from "./pages/EmailVerification";
import ResendVerification from "./pages/ResendVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider, useNotification } from "./contexts/NotificationContext";

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isAuthenticated, loading, setShowLoginModal } = useAuth();

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner">加载中...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		setShowLoginModal(true);
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
};

function AppContent() {
	const { isAuthenticated, loading, logout, showLoginModal, setShowLoginModal } = useAuth();

	const handleLogout = async () => {
		await logout();
	};

	const handleLoginRequired = () => {
		setShowLoginModal(true);
	};

	const handleLoginModalClose = () => {
		setShowLoginModal(false);
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner">加载中...</div>
			</div>
		);
	}

	return (
		<Router>
			<div className="App">
				<Navigation
					onLogout={handleLogout}
					onLoginRequired={handleLoginRequired}
					isAuthenticated={isAuthenticated}
				/>
				<main className="main-content">
					<Routes>
						{/* Public routes */}
						<Route
							path="/"
							element={<FoodSearch onLoginRequired={handleLoginRequired} />}
						/>
						<Route
							path="/api-test"
							element={<ApiTest onLoginRequired={handleLoginRequired} />}
						/>
						<Route
							path="/token-test"
							element={<TokenTest onLoginRequired={handleLoginRequired} />}
						/>

						{/* Email verification routes */}
						<Route path="/verify-email/:token" element={<EmailVerification />} />
						<Route path="/resend-verification" element={<ResendVerification />} />
						<Route path="/forgot-password" element={<ForgotPassword />} />
						<Route path="/reset-password/:token" element={<ResetPassword />} />

						{/* Protected routes */}
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard onLoginRequired={handleLoginRequired} />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/statistics"
							element={
								<ProtectedRoute>
									<MealStats onLoginRequired={handleLoginRequired} />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/profile"
							element={
								<ProtectedRoute>
									<Profile onLoginRequired={handleLoginRequired} />
								</ProtectedRoute>
							}
						/>

						{/* Catch all route */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</main>
				<LoginModal
					isOpen={showLoginModal}
					onClose={handleLoginModalClose}
					onSuccess={() => setShowLoginModal(false)}
				/>
			</div>
		</Router>
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
