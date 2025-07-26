import { apiClient } from "../utils/api";
import {
	ApiResponse,
	AuthData,
	LoginRequest,
	RegisterRequest,
	RefreshTokenRequest,
} from "../types/api";

class AuthService {
	async register(data: RegisterRequest): Promise<ApiResponse<AuthData>> {
		const response = await apiClient.post<AuthData>("/auth/register", data);

		if (response.success && response.data) {
			apiClient.setToken(response.data.access);
			localStorage.setItem("refresh_token", response.data.refresh);
		}

		return response;
	}

	async login(data: LoginRequest): Promise<ApiResponse<AuthData>> {
		const response = await apiClient.post<AuthData>("/auth/login", data);

		if (response.success && response.data) {
			apiClient.setToken(response.data.access);
			localStorage.setItem("refresh_token", response.data.refresh);
		}

		return response;
	}

	async refreshToken(): Promise<ApiResponse<AuthData>> {
		const refreshToken = localStorage.getItem("refresh_token");

		if (!refreshToken) {
			throw new Error("No refresh token available");
		}

		const data: RefreshTokenRequest = { refresh: refreshToken };
		const response = await apiClient.post<AuthData>("/auth/refresh", data);

		if (response.success && response.data) {
			apiClient.setToken(response.data.access);
			localStorage.setItem("refresh_token", response.data.refresh);
		}

		return response;
	}

	async logout(): Promise<ApiResponse<void>> {
		try {
			const refreshToken = localStorage.getItem("refresh_token");
			const response = await apiClient.post<void>("/auth/logout", {
				refresh_token: refreshToken,
			});
			return response;
		} finally {
			apiClient.setToken(null);
			localStorage.removeItem("refresh_token");
			localStorage.removeItem("user");
		}
	}

	isAuthenticated(): boolean {
		return !!apiClient.getToken();
	}

	getCurrentToken(): string | null {
		return apiClient.getToken();
	}

	setToken(token: string | null): void {
		apiClient.setToken(token);
	}

	async getCurrentUser(): Promise<ApiResponse<any>> {
		return apiClient.get<any>("/auth/user/");
	}
}

export const authService = new AuthService();
