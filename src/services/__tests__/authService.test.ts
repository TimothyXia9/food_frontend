import { authService } from "../authService";
import { apiClient } from "../../utils/api";

// Mock the API client
jest.mock("../../utils/api", () => ({
	apiClient: {
		post: jest.fn(),
		setToken: jest.fn(),
		getToken: jest.fn(),
	},
}));

// Mock localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("AuthService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("register", () => {
		it("should register a user successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					user: {
						id: 1,
						username: "testuser",
						email: "test@example.com",
						nickname: "Test User",
					},
					token: "mock-token",
					refresh_token: "mock-refresh-token",
				},
			};

			mockedApiClient.post.mockResolvedValue(mockResponse);

			const registerData = {
				username: "testuser",
				email: "test@example.com",
				password: "password123",
				nickname: "Test User",
			};

			const result = await authService.register(registerData);

			expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/register", registerData);
			expect(mockedApiClient.setToken).toHaveBeenCalledWith("mock-token");
			expect(result).toEqual(mockResponse);
		});

		it("should handle registration failure", async () => {
			const mockError = new Error("Registration failed");
			mockedApiClient.post.mockRejectedValue(mockError);

			const registerData = {
				username: "testuser",
				email: "test@example.com",
				password: "password123",
				nickname: "Test User",
			};

			await expect(authService.register(registerData)).rejects.toThrow("Registration failed");
			expect(mockedApiClient.setToken).not.toHaveBeenCalled();
		});
	});

	describe("login", () => {
		it("should login a user successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					user: {
						id: 1,
						username: "testuser",
						email: "test@example.com",
						nickname: "Test User",
					},
					token: "mock-token",
					refresh_token: "mock-refresh-token",
				},
			};

			mockedApiClient.post.mockResolvedValue(mockResponse);

			const loginData = {
				username: "testuser",
				password: "password123",
			};

			const result = await authService.login(loginData);

			expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/login", loginData);
			expect(mockedApiClient.setToken).toHaveBeenCalledWith("mock-token");
			expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "mock-refresh-token");
			expect(result).toEqual(mockResponse);
		});
	});

	describe("refreshToken", () => {
		it("should refresh token successfully", async () => {
			localStorageMock.getItem.mockReturnValue("mock-refresh-token");

			const mockResponse = {
				success: true,
				data: {
					user: {
						id: 1,
						username: "testuser",
						email: "test@example.com",
						nickname: "Test User",
					},
					token: "new-mock-token",
					refresh_token: "new-mock-refresh-token",
				},
			};

			mockedApiClient.post.mockResolvedValue(mockResponse);

			const result = await authService.refreshToken();

			expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/refresh", {
				refresh_token: "mock-refresh-token",
			});
			expect(mockedApiClient.setToken).toHaveBeenCalledWith("new-mock-token");
			expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "new-mock-refresh-token");
			expect(result).toEqual(mockResponse);
		});

		it("should throw error when no refresh token is available", async () => {
			localStorageMock.getItem.mockReturnValue(null);

			await expect(authService.refreshToken()).rejects.toThrow("No refresh token available");
			expect(mockedApiClient.post).not.toHaveBeenCalled();
		});
	});

	describe("logout", () => {
		it("should logout successfully", async () => {
			const mockResponse = { success: true };
			mockedApiClient.post.mockResolvedValue(mockResponse);

			const result = await authService.logout();

			expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/logout");
			expect(mockedApiClient.setToken).toHaveBeenCalledWith(null);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token");
			expect(result).toEqual(mockResponse);
		});

		it("should cleanup tokens even if logout request fails", async () => {
			mockedApiClient.post.mockRejectedValue(new Error("Network error"));

			await expect(authService.logout()).rejects.toThrow("Network error");
			expect(mockedApiClient.setToken).toHaveBeenCalledWith(null);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token");
		});
	});

	describe("isAuthenticated", () => {
		it("should return true when user is authenticated", () => {
			mockedApiClient.getToken.mockReturnValue("mock-token");

			const result = authService.isAuthenticated();

			expect(result).toBe(true);
		});

		it("should return false when user is not authenticated", () => {
			mockedApiClient.getToken.mockReturnValue(null);

			const result = authService.isAuthenticated();

			expect(result).toBe(false);
		});
	});

	describe("getCurrentToken", () => {
		it("should return current token", () => {
			mockedApiClient.getToken.mockReturnValue("mock-token");

			const result = authService.getCurrentToken();

			expect(result).toBe("mock-token");
		});
	});
});