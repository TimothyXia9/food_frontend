import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { apiClient } from "../utils/api";
import { User } from "../types/api";

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	showLoginModal: boolean;
	setShowLoginModal: (show: boolean) => void;
	login: (credentials: {
		username: string;
		password: string;
	}) => Promise<boolean>;
	setUserData: (user: User, token: string) => void;
	register: (data: {
		username: string;
		email: string;
		password: string;
		nickname: string;
	}) => Promise<boolean>;
	logout: () => Promise<void>;
	handleAuthFailure: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [lastAuthFailureTime, setLastAuthFailureTime] = useState(0);

	const isAuthenticated = !!user && authService.isAuthenticated();

	// Monitor token changes to keep user state in sync
	React.useEffect(() => {
		const token = authService.getCurrentToken();
		if (!token && user) {
			// Token was cleared but user state still exists, clear user state
			setUser(null);
		}
	}, [user]);

	// Check if user is already logged in on app start
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = authService.getCurrentToken();
				if (token) {
					// Try to get user info from localStorage first
					const savedUser = localStorage.getItem("user");
					if (savedUser) {
						try {
							const parsedUser = JSON.parse(savedUser);
							setUser(parsedUser);
						} catch (error) {
							console.error("Failed to parse saved user:", error);
						}
					}

					// Verify token is still valid by making a profile request
					try {
						const response = await authService.getCurrentUser();
						if (response.success && response.data) {
							setUser(response.data);
							localStorage.setItem("user", JSON.stringify(response.data));
						} else {
							// Token is invalid, clear everything silently
							authService.setToken(null);
							setUser(null);
						}
					} catch (error) {
						console.error("Token verification failed:", error);
						// Token is invalid, clear everything silently
						authService.setToken(null);
						setUser(null);
					}
				}
			} catch (error) {
				console.error("Auth check failed:", error);
			} finally {
				setLoading(false);
			}
		};

		checkAuthStatus();
	}, []);

	const login = async (credentials: {
		username: string;
		password: string;
	}): Promise<boolean> => {
		try {
			const response = await authService.login(credentials);
			if (response.success && response.data) {
				setUser(response.data.user);
				// Save user info to localStorage for persistence
				localStorage.setItem("user", JSON.stringify(response.data.user));
				return true;
			}
			return false;
		} catch (error) {
			console.error("Login failed:", error);
			return false;
		}
	};

	const setUserData = (userData: User, token: string) => {
		authService.setToken(token);
		setUser(userData);
		localStorage.setItem("user", JSON.stringify(userData));
	};

	const register = async (data: {
		username: string;
		email: string;
		password: string;
		nickname: string;
	}): Promise<boolean> => {
		try {
			const response = await authService.register(data);
			if (response.success) {
				// Registration successful but no auto-login - user needs to verify email
				return true;
			}
			return false;
		} catch (error) {
			console.error("Registration failed:", error);
			return false;
		}
	};

	const logout = async (): Promise<void> => {
		try {
			await authService.logout();
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			setUser(null);
			// Clear user info from localStorage
			localStorage.removeItem("user");
		}
	};

	const handleAuthFailure = (): void => {
		const now = Date.now();
		const authFailureCooldown = 2000; // 2秒冷却时间，避免重复显示登录弹窗

		// 检查是否在冷却时间内，避免重复处理认证失败
		if (now - lastAuthFailureTime < authFailureCooldown) {
			return;
		}

		setLastAuthFailureTime(now);
		setUser(null);
		localStorage.removeItem("user");

		// 只在没有显示登录弹窗时才显示
		if (!showLoginModal) {
			setShowLoginModal(true);
		}
	};

	// Set up the auth failure handler for the API client
	React.useEffect(() => {
		apiClient.setAuthFailureHandler(handleAuthFailure);
	}, []);

	const value: AuthContextType = {
		user,
		isAuthenticated,
		loading,
		showLoginModal,
		setShowLoginModal,
		login,
		setUserData,
		register,
		logout,
		handleAuthFailure,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
