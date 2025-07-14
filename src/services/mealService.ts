import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Meal,
	MealsByDate,
	CreateMealRequest,
	AddFoodToMealRequest,
	UpdateFoodInMealRequest,
} from "../types/api";

interface MealParams {
  date?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
}

class MealService {
	async getMealsByDate(params: MealParams = {}): Promise<ApiResponse<MealsByDate>> {
		return apiClient.get<MealsByDate>("/meals", params as unknown as Record<string, unknown>);
	}

	async createMeal(data: CreateMealRequest): Promise<ApiResponse<Meal>> {
		return apiClient.post<Meal>("/meals", data);
	}

	async updateMeal(mealId: number, data: CreateMealRequest): Promise<ApiResponse<Meal>> {
		return apiClient.put<Meal>(`/meals/${mealId}`, data);
	}

	async deleteMeal(mealId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/meals/${mealId}`);
	}

	async addFoodToMeal(mealId: number, data: AddFoodToMealRequest): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`/meals/${mealId}/foods`, data);
	}

	async updateFoodInMeal(
		mealId: number,
		mealFoodId: number,
		data: UpdateFoodInMealRequest
	): Promise<ApiResponse<void>> {
		return apiClient.put<void>(`/meals/${mealId}/foods/${mealFoodId}`, data);
	}

	async removeFoodFromMeal(mealId: number, mealFoodId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/meals/${mealId}/foods/${mealFoodId}`);
	}
}

export const mealService = new MealService();