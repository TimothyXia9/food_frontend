import { ApiResponse } from "../types/api";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
	private baseURL: string;
	private token: string | null = null;

	constructor(baseURL: string = API_BASE_URL) {
		this.baseURL = baseURL;
		this.token = localStorage.getItem("auth_token");
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
		options: RequestInit = {}
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
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error?.message || "Request failed");
			}

			return data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
		const url = new URL(`${this.baseURL}${endpoint}`);
		if (params) {
			Object.keys(params).forEach(key => {
				if (params[key] !== undefined && params[key] !== null) {
					url.searchParams.append(key, params[key].toString());
				}
			});
		}

		return this.request<T>(url.pathname + url.search, {
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

	async uploadFile<T>(
		endpoint: string,
		file: File,
		additionalData?: Record<string, string>
	): Promise<ApiResponse<T>> {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.getToken();

		const formData = new FormData();
		formData.append("file", file);

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

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error?.message || "Upload failed");
			}

			return data;
		} catch (error) {
			console.error("File upload failed:", error);
			throw error;
		}
	}
}

export const apiClient = new ApiClient();