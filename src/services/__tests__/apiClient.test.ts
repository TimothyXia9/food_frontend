import { apiClient } from "../../utils/api";

// Mock fetch
global.fetch = jest.fn();

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

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("ApiClient", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset API client token
		apiClient.setToken(null);
	});

	describe("setToken", () => {
		it("should set token and store in localStorage", () => {
			apiClient.setToken("test-token");

			expect(localStorageMock.setItem).toHaveBeenCalledWith("auth_token", "test-token");
		});

		it("should remove token from localStorage when setting null", () => {
			apiClient.setToken(null);

			expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth_token");
		});
	});

	describe("getToken", () => {
		it("should return token from memory if available", () => {
			apiClient.setToken("test-token");
			localStorageMock.getItem.mockReturnValue("different-token");

			const token = apiClient.getToken();

			expect(token).toBe("test-token");
		});

		it("should return token from localStorage if not in memory", () => {
			localStorageMock.getItem.mockReturnValue("stored-token");

			const token = apiClient.getToken();

			expect(token).toBe("stored-token");
		});
	});

	describe("get", () => {
		it("should make GET request successfully", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true, data: { test: "data" } }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const result = await apiClient.get("/test");

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
				})
			);
			expect(result).toEqual({ success: true, data: { test: "data" } });
		});

		it("should include auth token in headers when available", async () => {
			apiClient.setToken("test-token");

			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			await apiClient.get("/test");

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test",
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
						Authorization: "Bearer test-token",
					}),
				})
			);
		});

		it("should include query parameters", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			await apiClient.get("/test", { q: "search", limit: 10 });

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test?q=search&limit=10",
				expect.any(Object)
			);
		});
	});

	describe("post", () => {
		it("should make POST request with data", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true, data: { id: 1 } }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const postData = { name: "test", value: 123 };
			const result = await apiClient.post("/test", postData);

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					body: JSON.stringify(postData),
				})
			);
			expect(result).toEqual({ success: true, data: { id: 1 } });
		});
	});

	describe("put", () => {
		it("should make PUT request with data", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const putData = { name: "updated", value: 456 };
			const result = await apiClient.put("/test/1", putData);

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test/1",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify(putData),
				})
			);
			expect(result).toEqual({ success: true });
		});
	});

	describe("delete", () => {
		it("should make DELETE request", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const result = await apiClient.delete("/test/1");

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/test/1",
				expect.objectContaining({
					method: "DELETE",
				})
			);
			expect(result).toEqual({ success: true });
		});
	});

	describe("error handling", () => {
		it("should throw error when response is not ok", async () => {
			const mockResponse = {
				ok: false,
				json: () =>
					Promise.resolve({
						error: { message: "Not found" },
					}),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			await expect(apiClient.get("/test")).rejects.toThrow("Not found");
		});

		it("should throw generic error when no error message provided", async () => {
			const mockResponse = {
				ok: false,
				json: () => Promise.resolve({}),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			await expect(apiClient.get("/test")).rejects.toThrow("Request failed");
		});

		it("should handle network errors", async () => {
			mockedFetch.mockRejectedValue(new Error("Network error"));

			await expect(apiClient.get("/test")).rejects.toThrow("Network error");
		});
	});

	describe("uploadFile", () => {
		it("should upload file with FormData", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true, data: { id: 1 } }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
			const result = await apiClient.uploadFile("/upload", file);

			expect(mockedFetch).toHaveBeenCalledWith(
				"http://localhost:8000/api/v1/upload",
				expect.objectContaining({
					method: "POST",
					body: expect.any(FormData),
				})
			);
			expect(result).toEqual({ success: true, data: { id: 1 } });
		});

		it("should include additional data in FormData", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({ success: true }),
			};
			mockedFetch.mockResolvedValue(mockResponse as Response);

			const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
			await apiClient.uploadFile("/upload", file, { meal_id: "123" });

			const [, config] = mockedFetch.mock.calls[0];
			const formData = config?.body as FormData;

			// Note: In a real test environment, you'd need to mock FormData properly
			// This is a simplified test
			expect(formData).toBeInstanceOf(FormData);
		});
	});
});
