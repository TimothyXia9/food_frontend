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
	login: (credentials: { username: string; password: string }) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [showLoginModal, setShowLoginModal] = useState(false);

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

	const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
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

	const register = async (data: {
		username: string;
		email: string;
		password: string;
		nickname: string;
	}): Promise<boolean> => {
		try {
			const response = await authService.register(data);
			if (response.success && response.data) {
				setUser(response.data.user);
				// Save user info to localStorage for persistence
				localStorage.setItem("user", JSON.stringify(response.data.user));
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
		setUser(null);
		localStorage.removeItem("user");
		setShowLoginModal(true);
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
		register,
		logout,
		handleAuthFailure,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
