import { apiClient } from "../utils/api";
import {
	ApiResponse,
	DailySummary,
	WeeklySummary,
	UpdateWeightRequest,
	MonthlySummary,
	NutritionTrends,
} from "../types/api";

interface DailySummaryParams {
  date?: string;
}

interface WeeklySummaryParams {
  start_date?: string;
}

interface MonthlySummaryParams {
  year?: number;
  month?: number;
}

interface NutritionTrendsParams {
  period: "week" | "month";
  start_date?: string;
}

class StatisticsService {
	async getDailySummary(params: DailySummaryParams = {}): Promise<ApiResponse<DailySummary>> {
		return apiClient.get<DailySummary>("/summary/daily", params);
	}

	async updateDailyWeight(data: UpdateWeightRequest): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/summary/daily/weight", data);
	}

	async getWeeklySummary(params: WeeklySummaryParams = {}): Promise<ApiResponse<WeeklySummary>> {
		return apiClient.get<WeeklySummary>("/statistics/weekly", params);
	}

	async getMonthlySummary(params: MonthlySummaryParams = {}): Promise<ApiResponse<MonthlySummary>> {
		return apiClient.get<MonthlySummary>("/statistics/monthly", params);
	}

	async getNutritionTrends(params: NutritionTrendsParams): Promise<ApiResponse<NutritionTrends>> {
		return apiClient.get<NutritionTrends>("/statistics/nutrition-trends", params);
	}
}

export const statisticsService = new StatisticsService();