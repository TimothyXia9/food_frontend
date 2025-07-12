import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Food,
	FoodCategory,
	FoodSearchParams,
	FoodSearchResult,
	CreateFoodRequest,
} from "../types/api";

class FoodService {
	async searchFoods(params: FoodSearchParams): Promise<ApiResponse<FoodSearchResult>> {
		return apiClient.get<FoodSearchResult>("/foods/search", params);
	}

	async getFoodDetails(foodId: number): Promise<ApiResponse<Food>> {
		return apiClient.get<Food>(`/foods/${foodId}`);
	}

	async createCustomFood(data: CreateFoodRequest): Promise<ApiResponse<Food>> {
		return apiClient.post<Food>("/foods", data);
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
}

export const foodService = new FoodService();