import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Food,
	FoodSearchParams,
	FoodSearchResult,
	CreateFoodRequest,
	DeleteFoodResponse,
	USDAFoodSearchParams,
	USDAFoodSearchResult,
	USDANutritionData,
	CreateFoodFromUSDARequest,
} from "../types/api";

class FoodService {
	async searchFoods(params: FoodSearchParams): Promise<ApiResponse<FoodSearchResult>> {
		return apiClient.get<FoodSearchResult>(
			"/foods/search/",
			params as unknown as Record<string, unknown>
		);
	}

	async getFoodDetails(foodId: number): Promise<ApiResponse<Food>> {
		return apiClient.get<Food>(`/foods/${foodId}/`);
	}

	async createCustomFood(data: CreateFoodRequest): Promise<ApiResponse<Food>> {
		return apiClient.post<Food>("/foods/create/", data);
	}

	async updateCustomFood(foodId: number, data: CreateFoodRequest): Promise<ApiResponse<Food>> {
		return apiClient.put<Food>(`/foods/${foodId}/update/`, data);
	}

	async deleteCustomFood(foodId: number): Promise<ApiResponse<DeleteFoodResponse>> {
		return apiClient.delete<DeleteFoodResponse>(`/foods/${foodId}/delete/`);
	}

	// USDA API methods
	async searchUSDAFoods(
		params: USDAFoodSearchParams
	): Promise<ApiResponse<USDAFoodSearchResult>> {
		return apiClient.get<USDAFoodSearchResult>(
			"/foods/usda/search/",
			params as unknown as Record<string, unknown>
		);
	}

	async getUSDANutrition(fdcId: string): Promise<ApiResponse<USDANutritionData>> {
		return apiClient.get<USDANutritionData>(`/foods/usda/nutrition/${fdcId}/`);
	}

	async createFoodFromUSDA(data: CreateFoodFromUSDARequest): Promise<ApiResponse<Food>> {
		return apiClient.post<Food>("/foods/usda/create/", data);
	}

	async getUserFoods(page?: number, page_size?: number): Promise<ApiResponse<FoodSearchResult>> {
		const params: Record<string, unknown> = {};
		if (page) params.page = page;
		if (page_size) params.page_size = page_size;
		return apiClient.get<FoodSearchResult>("/foods/user/", params);
	}

	async getSearchHistory(limit?: number): Promise<ApiResponse<{ searches: any[] }>> {
		const params = limit ? { limit } : {};
		return apiClient.get<{ searches: any[] }>("/foods/search/history/", params);
	}
}

export const foodService = new FoodService();
