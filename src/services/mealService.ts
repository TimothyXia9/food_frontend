import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Meal,
	CreateMealRequest,
	AddFoodToMealRequest,
	UpdateFoodInMealRequest,
} from "../types/api";

interface MealListParams {
  date?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
  page?: number;
  page_size?: number;
}

class MealService {
	async createMeal(data: CreateMealRequest): Promise<ApiResponse<Meal>> {
		return apiClient.post<Meal>("/meals/create/", data);
	}

	async getMealDetails(mealId: number): Promise<ApiResponse<Meal>> {
		return apiClient.get<Meal>(`/meals/${mealId}/`);
	}

	async updateMeal(mealId: number, data: CreateMealRequest): Promise<ApiResponse<Meal>> {
		return apiClient.put<Meal>(`/meals/${mealId}/update/`, data);
	}

	async deleteMeal(mealId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/meals/${mealId}/delete/`);
	}

	async getUserMeals(params: MealListParams = {}): Promise<ApiResponse<{ meals: Meal[]; total_count: number; page: number; page_size: number; total_pages: number }>> {
		return apiClient.get<{ meals: Meal[]; total_count: number; page: number; page_size: number; total_pages: number }>("/meals/list/", params as unknown as Record<string, unknown>);
	}

	async getRecentMeals(limit?: number): Promise<ApiResponse<{ meals: Meal[] }>> {
		const params = limit ? { limit } : {};
		return apiClient.get<{ meals: Meal[] }>("/meals/recent/", params);
	}

	async addFoodToMeal(mealId: number, data: AddFoodToMealRequest): Promise<ApiResponse<{ meal_food_id: number; food: any; quantity: number; calories: number }>> {
		return apiClient.post<{ meal_food_id: number; food: any; quantity: number; calories: number }>(`/meals/${mealId}/add-food/`, data);
	}

	async updateMealFood(mealFoodId: number, data: UpdateFoodInMealRequest): Promise<ApiResponse<any>> {
		return apiClient.put<any>(`/meals/food/${mealFoodId}/update/`, data);
	}

	async removeFoodFromMeal(mealFoodId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/meals/food/${mealFoodId}/delete/`);
	}

	async createMealPlan(data: { start_date: string; end_date: string; meal_template: any }): Promise<ApiResponse<{ meals_created: number; start_date: string; end_date: string }>> {
		return apiClient.post<{ meals_created: number; start_date: string; end_date: string }>("/meals/plan/", data);
	}
}

export const mealService = new MealService();