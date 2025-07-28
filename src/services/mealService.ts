import { apiClient } from "../utils/api";
import {
	ApiResponse,
	Meal,
	CreateMealRequest,
	AddFoodToMealRequest,
	UpdateFoodInMealRequest,
} from "../types/api";
import { localToUTC, localDateToUTCRange, localDateRangeToUTCRange } from "../utils/timezone";

interface MealListParams {
	date?: string;
	start_date?: string;
	end_date?: string;
	meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
	page?: number;
	page_size?: number;
}

// 内部使用的参数接口，包含 UTC 时间参数
interface InternalMealListParams extends Omit<MealListParams, "date" | "start_date" | "end_date"> {
	start_datetime_utc?: string;
	end_datetime_utc?: string;
}

// 餐食统计参数接口
interface MealStatisticsParams {
	start_datetime_utc: string;
	end_datetime_utc: string;
	meal_type?: string;
}

// 餐食计划模板接口
interface MealTemplate {
	meal_type: string;
	foods: Array<{
		food_id: number;
		quantity: number;
	}>;
}

// 餐食比较参数接口
interface MealComparisonParams {
	date1: string;
	date2: string;
	meal_type?: string;
}

class MealService {
	async createMeal(data: CreateMealRequest): Promise<ApiResponse<Meal>> {
		// 如果有日期时间，转换为UTC
		const processedData = { ...data };
		if (data.date && data.date.includes("T")) {
			// 如果包含时间，转换为UTC
			const localDateTime = new Date(data.date);
			processedData.date = localToUTC(localDateTime);
		}
		return apiClient.post<Meal>("/meals/create/", processedData);
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

	async getUserMeals(params: MealListParams = {}): Promise<
		ApiResponse<{
			meals: Meal[];
			total_count: number;
			page: number;
			page_size: number;
			total_pages: number;
		}>
	> {
		// 将本地日期参数转换为 UTC 时间范围参数
		const processedParams: InternalMealListParams = {
			meal_type: params.meal_type,
			page: params.page,
			page_size: params.page_size,
		};

		// 如果有单个日期参数，转换为 UTC 时间范围
		if (params.date) {
			const utcRange = localDateToUTCRange(params.date);
			processedParams.start_datetime_utc = utcRange.start_datetime_utc;
			processedParams.end_datetime_utc = utcRange.end_datetime_utc;
		}
		// 如果有日期范围参数，转换为 UTC 时间范围
		else if (params.start_date && params.end_date) {
			const utcRange = localDateRangeToUTCRange(params.start_date, params.end_date);
			processedParams.start_datetime_utc = utcRange.start_datetime_utc;
			processedParams.end_datetime_utc = utcRange.end_datetime_utc;
		}
		// 如果只有开始日期，转换为 UTC 开始时间
		else if (params.start_date) {
			const utcRange = localDateToUTCRange(params.start_date);
			processedParams.start_datetime_utc = utcRange.start_datetime_utc;
		}
		// 如果只有结束日期，转换为 UTC 结束时间
		else if (params.end_date) {
			const utcRange = localDateToUTCRange(params.end_date);
			processedParams.end_datetime_utc = utcRange.end_datetime_utc;
		}

		return apiClient.get<{
			meals: Meal[];
			total_count: number;
			page: number;
			page_size: number;
			total_pages: number;
		}>("/meals/list/", processedParams as unknown as Record<string, unknown>);
	}

	async getRecentMeals(limit?: number): Promise<ApiResponse<{ meals: Meal[] }>> {
		const params = limit ? { limit } : {};
		return apiClient.get<{ meals: Meal[] }>("/meals/recent/", params);
	}

	async addFoodToMeal(
		mealId: number,
		data: AddFoodToMealRequest
	): Promise<
		ApiResponse<{ meal_food_id: number; food: object; quantity: number; calories: number }>
	> {
		return apiClient.post<{
			meal_food_id: number;
			food: object;
			quantity: number;
			calories: number;
		}>(`/meals/${mealId}/add-food/`, data);
	}

	async updateMealFood(
		mealFoodId: number,
		data: UpdateFoodInMealRequest
	): Promise<
		ApiResponse<{
			meal_food_id: number;
			new_quantity: number;
			new_calories: number;
			message: string;
		}>
	> {
		return apiClient.put<{
			meal_food_id: number;
			new_quantity: number;
			new_calories: number;
			message: string;
		}>(`/meals/food/${mealFoodId}/update/`, data);
	}

	async removeFoodFromMeal(mealFoodId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/meals/food/${mealFoodId}/delete/`);
	}

	async createMealPlan(data: {
		start_date: string;
		end_date: string;
		meal_template: MealTemplate;
	}): Promise<ApiResponse<{ meals_created: number; start_date: string; end_date: string }>> {
		return apiClient.post<{ meals_created: number; start_date: string; end_date: string }>(
			"/meals/plan/",
			data
		);
	}

	async getMealStatistics(date: string, mealType?: string): Promise<ApiResponse<object>> {
		// 将本地日期转换为 UTC 时间范围
		const utcRange = localDateToUTCRange(date);
		const params: MealStatisticsParams = {
			start_datetime_utc: utcRange.start_datetime_utc,
			end_datetime_utc: utcRange.end_datetime_utc,
		};
		if (mealType) {
			params.meal_type = mealType;
		}
		return apiClient.get<object>(
			"/meals/statistics/",
			params as unknown as Record<string, unknown>
		);
	}

	async getMealComparison(
		date1: string,
		date2: string,
		mealType?: string
	): Promise<ApiResponse<object>> {
		const params: MealComparisonParams = { date1, date2 };
		if (mealType) {
			params.meal_type = mealType;
		}
		return apiClient.get<object>(
			"/meals/comparison/",
			params as unknown as Record<string, unknown>
		);
	}

	async getDailySummary(date: string): Promise<ApiResponse<object>> {
		return apiClient.get<object>("/meals/daily-summary/", { date });
	}

	async getNutritionStats(startDate: string, endDate: string): Promise<ApiResponse<object>> {
		// 将本地日期范围转换为 UTC 时间范围
		const utcRange = localDateRangeToUTCRange(startDate, endDate);
		return apiClient.get<object>("/meals/nutrition-stats/", {
			start_datetime_utc: utcRange.start_datetime_utc,
			end_datetime_utc: utcRange.end_datetime_utc,
		});
	}
}

export const mealService = new MealService();
