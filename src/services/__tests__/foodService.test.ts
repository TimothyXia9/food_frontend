import { foodService } from "../foodService";
import { apiClient } from "../../utils/api";

// Mock the API client
jest.mock("../../utils/api", () => ({
	apiClient: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
	},
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("FoodService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("searchFoods", () => {
		it("should search foods successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					foods: [
						{
							id: 1,
							name: "Apple",
							category: { id: 1, name: "Fruits" },
							calories_per_100g: 52,
							protein_per_100g: 0.3,
							fat_per_100g: 0.2,
							carbs_per_100g: 14,
							fiber_per_100g: 2.4,
							sugar_per_100g: 10,
							sodium_per_100g: 1,
							is_custom: false,
							created_by: null,
							serving_size: 100,
						},
					],
					total: 1,
					has_next: false,
				},
			};

			mockedApiClient.get.mockResolvedValue(mockResponse);

			const searchParams = { query: "apple", page_size: 10 };
			const result = await foodService.searchFoods(searchParams);

			expect(mockedApiClient.get).toHaveBeenCalledWith("/foods/search/", searchParams);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("getFoodDetails", () => {
		it("should get food details successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					id: 1,
					name: "Apple",
					category: { id: 1, name: "Fruits" },
					calories_per_100g: 52,
					protein_per_100g: 0.3,
					fat_per_100g: 0.2,
					carbs_per_100g: 14,
					fiber_per_100g: 2.4,
					sugar_per_100g: 10,
					sodium_per_100g: 1,
					is_custom: false,
					created_by: null,
					serving_size: 100,
					aliases: ["红苹果", "苹果"],
				},
			};

			mockedApiClient.get.mockResolvedValue(mockResponse);

			const result = await foodService.getFoodDetails(1);

			expect(mockedApiClient.get).toHaveBeenCalledWith("/foods/1");
			expect(result).toEqual(mockResponse);
		});
	});

	describe("createCustomFood", () => {
		it("should create custom food successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					id: 2,
					name: "Custom Salad",
					category: { id: 1, name: "Vegetables" },
					calories_per_100g: 120,
					protein_per_100g: 8.5,
					fat_per_100g: 6.0,
					carbs_per_100g: 15.0,
					fiber_per_100g: 3.0,
					sugar_per_100g: 2.0,
					sodium_per_100g: 200,
					is_custom: true,
					created_by: 1,
					serving_size: 100,
				},
			};

			mockedApiClient.post.mockResolvedValue(mockResponse);

			const foodData = {
				name: "Custom Salad",
				category_id: 1,
				serving_size: 100,
				calories_per_100g: 120,
				protein_per_100g: 8.5,
				fat_per_100g: 6.0,
				carbs_per_100g: 15.0,
				fiber_per_100g: 3.0,
				sugar_per_100g: 2.0,
				sodium_per_100g: 200,
			};

			const result = await foodService.createCustomFood(foodData);

			expect(mockedApiClient.post).toHaveBeenCalledWith("/foods", foodData);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("updateCustomFood", () => {
		it("should update custom food successfully", async () => {
			const mockResponse = {
				success: true,
				data: {
					id: 2,
					name: "Updated Custom Salad",
					category: { id: 1, name: "Vegetables" },
					calories_per_100g: 130,
					protein_per_100g: 9.0,
					fat_per_100g: 6.5,
					carbs_per_100g: 16.0,
					fiber_per_100g: 3.5,
					sugar_per_100g: 2.5,
					sodium_per_100g: 220,
					is_custom: true,
					created_by: 1,
					serving_size: 100,
				},
			};

			mockedApiClient.put.mockResolvedValue(mockResponse);

			const foodData = {
				name: "Updated Custom Salad",
				category_id: 1,
				serving_size: 100,
				calories_per_100g: 130,
				protein_per_100g: 9.0,
				fat_per_100g: 6.5,
				carbs_per_100g: 16.0,
				fiber_per_100g: 3.5,
				sugar_per_100g: 2.5,
				sodium_per_100g: 220,
			};

			const result = await foodService.updateCustomFood(2, foodData);

			expect(mockedApiClient.put).toHaveBeenCalledWith("/foods/2", foodData);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("deleteCustomFood", () => {
		it("should delete custom food successfully", async () => {
			const mockResponse = { success: true };

			mockedApiClient.delete.mockResolvedValue(mockResponse);

			const result = await foodService.deleteCustomFood(2);

			expect(mockedApiClient.delete).toHaveBeenCalledWith("/foods/2");
			expect(result).toEqual(mockResponse);
		});
	});

	// Note: Categories feature was removed from backend
	// describe("getFoodCategories", () => {
	// 	it("should get food categories successfully", async () => {
	// 		const mockResponse = {
	// 			success: true,
	// 			data: [
	// 				{ id: 1, name: "Fruits", description: "Fresh and dried fruits" },
	// 				{ id: 2, name: "Vegetables", description: "Fresh and cooked vegetables" },
	// 				{ id: 3, name: "Grains", description: "Rice, bread, pasta, etc." },
	// 			],
	// 		};

	// 		mockedApiClient.get.mockResolvedValue(mockResponse);

	// 		const result = await foodService.getFoodCategories();

	// 		expect(mockedApiClient.get).toHaveBeenCalledWith("/foods/categories");
	// 		expect(result).toEqual(mockResponse);
	// 	});
	// });
});