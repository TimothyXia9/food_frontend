import { ApiResponse } from "../types/api";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/v1";

class ApiClient {
	private baseURL: string;
	private token: string | null = null;
	private onAuthFailure: (() => void) | null = null;

	constructor(baseURL: string = API_BASE_URL) {
		this.baseURL = baseURL;
		this.token = localStorage.getItem("auth_token");
	}

	setAuthFailureHandler(handler: () => void) {
		this.onAuthFailure = handler;
	}

	setToken(token: string | null) {
		this.token = token;
		if (token) {
			localStorage.setItem("auth_token", token);
		} else {
			localStorage.removeItem("auth_token");
		}
	}

	getToken(): string | null {
		return this.token || localStorage.getItem("auth_token");
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		isRetry: boolean = false
	): Promise<ApiResponse<T>> {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.getToken();

		const defaultHeaders: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (token) {
			defaultHeaders["Authorization"] = `Bearer ${token}`;
		}

		const config: RequestInit = {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		};

		try {
			const response = await fetch(url, config);

			// Handle 401 errors with token refresh
			if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
				try {
					await this.refreshToken();
					// Retry the request with new token
					return this.request(endpoint, options, true);
				} catch (refreshError) {
					// Refresh failed, redirect to login
					this.handleAuthFailure();
					throw new Error("Authentication failed");
				}
			}

			const data = await response.json();

			if (!response.ok) {
				const errorMessage =
					data.detail || data.error?.message || data.message || `HTTP ${response.status}`;
				const error = new Error(errorMessage);
				// Attach the full response data to the error for better handling
				(error as any).response = { data, status: response.status };
				throw error;
			}

			return data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	private async refreshToken(): Promise<void> {
		const refreshToken = localStorage.getItem("refresh_token");
		if (!refreshToken) {
			throw new Error("No refresh token available");
		}

		const response = await fetch(`${this.baseURL}/auth/refresh/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ refresh: refreshToken }),
		});

		if (!response.ok) {
			throw new Error("Token refresh failed");
		}

		const data = await response.json();
		if (data.success && data.data?.access) {
			this.setToken(data.data.access);
		} else {
			throw new Error("Invalid refresh response");
		}
	}

	private handleAuthFailure(): void {
		this.setToken(null);
		localStorage.removeItem("refresh_token");
		localStorage.removeItem("user");
		// Call the auth failure handler to show login modal
		if (this.onAuthFailure) {
			this.onAuthFailure();
		}
		console.log("Authentication failed - tokens cleared");
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
		let finalEndpoint = endpoint;
		if (params) {
			const searchParams = new URLSearchParams();
			Object.keys(params).forEach(key => {
				const value = params[key];
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			});
			finalEndpoint += `?${searchParams.toString()}`;
		}

		return this.request<T>(finalEndpoint, {
			method: "GET",
		});
	}

	async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.request<T>(endpoint, {
			method: "DELETE",
		});
	}

	async streamingRequest(
		endpoint: string,
		data?: unknown,
		abortController?: AbortController,
		isRetry: boolean = false
	): Promise<Response> {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.getToken();

		const defaultHeaders: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (token) {
			defaultHeaders["Authorization"] = `Bearer ${token}`;
		}

		const config: RequestInit = {
			method: "POST",
			headers: defaultHeaders,
			body: data ? JSON.stringify(data) : undefined,
			signal: abortController?.signal,
		};

		const response = await fetch(url, config);

		// Handle 401 errors with token refresh
		if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
			try {
				await this.refreshToken();
				// Retry the streaming request with new token
				return this.streamingRequest(endpoint, data, abortController, true);
			} catch (refreshError) {
				// Refresh failed, redirect to login
				this.handleAuthFailure();
				throw new Error("Authentication failed");
			}
		}

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response;
	}

	async uploadFile<T>(
		endpoint: string,
		file: File,
		additionalData?: Record<string, string>,
		isRetry: boolean = false
	): Promise<ApiResponse<T>> {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.getToken();

		const formData = new FormData();
		formData.append("image", file);

		if (additionalData) {
			Object.keys(additionalData).forEach(key => {
				formData.append(key, additionalData[key]);
			});
		}

		const headers: HeadersInit = {};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers,
				body: formData,
			});

			// Handle 401 errors with token refresh (similar to request method)
			if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
				try {
					await this.refreshToken();
					// Retry the upload with new token
					return this.uploadFile(endpoint, file, additionalData, true);
				} catch (refreshError) {
					// Refresh failed, redirect to login
					this.handleAuthFailure();
					throw new Error("Authentication failed");
				}
			}

			const data = await response.json();

			if (!response.ok) {
				const errorMessage =
					data.detail || data.error?.message || data.message || `HTTP ${response.status}`;
				const error = new Error(errorMessage);
				// Attach the full response data to the error for better handling
				(error as any).response = { data, status: response.status };
				throw error;
			}

			return data;
		} catch (error) {
			console.error("File upload failed:", error);
			throw error;
		}
	}
}

export const apiClient = new ApiClient();
