import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Food,
	FoodCategory,
	FoodSearchParams,
	FoodSearchResult,
	CreateFoodRequest,
	USDAFoodSearchParams,
	USDAFoodSearchResult,
	USDANutritionData,
	CreateFoodFromUSDARequest,
} from "../types/api";

class FoodService {
	async searchFoods(params: FoodSearchParams): Promise<ApiResponse<FoodSearchResult>> {
		return apiClient.get<FoodSearchResult>("/foods/search", params as unknown as Record<string, unknown>);
	}

	async getFoodDetails(foodId: number): Promise<ApiResponse<Food>> {
		return apiClient.get<Food>(`/foods/${foodId}`);
	}

	async createCustomFood(data: CreateFoodRequest): Promise<ApiResponse<Food>> {
		return apiClient.post<Food>("/foods/custom", data);
	}

	async updateCustomFood(foodId: number, data: CreateFoodRequest): Promise<ApiResponse<Food>> {
		return apiClient.put<Food>(`/foods/${foodId}`, data);
	}

	async deleteCustomFood(foodId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/foods/${foodId}`);
	}

	async getFoodCategories(): Promise<ApiResponse<FoodCategory[]>> {
		return apiClient.get<FoodCategory[]>("/foods/categories");
	}

	// USDA API methods
	async searchUSDAFoods(params: USDAFoodSearchParams): Promise<ApiResponse<USDAFoodSearchResult>> {
		return apiClient.get<USDAFoodSearchResult>("/foods/usda/search", params as unknown as Record<string, unknown>);
	}

	async getUSDANutrition(fdcId: number): Promise<ApiResponse<USDANutritionData>> {
		return apiClient.get<USDANutritionData>(`/foods/usda/nutrition/${fdcId}`);
	}

	async createFoodFromUSDA(data: CreateFoodFromUSDARequest): Promise<ApiResponse<Food>> {
		return apiClient.post<Food>("/foods/usda/create", data);
	}
}

export const foodService = new FoodService();