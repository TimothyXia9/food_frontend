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
		return apiClient.get<DailySummary>("/summary/daily", params as unknown as Record<string, unknown>);
	}

	async updateDailyWeight(data: UpdateWeightRequest): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/summary/daily/weight", data);
	}

	async getWeeklySummary(params: WeeklySummaryParams = {}): Promise<ApiResponse<WeeklySummary>> {
		return apiClient.get<WeeklySummary>("/statistics/weekly", params as unknown as Record<string, unknown>);
	}

	async getMonthlySummary(params: MonthlySummaryParams = {}): Promise<ApiResponse<MonthlySummary>> {
		return apiClient.get<MonthlySummary>("/statistics/monthly", params as unknown as Record<string, unknown>);
	}

	async getNutritionTrends(params: NutritionTrendsParams): Promise<ApiResponse<NutritionTrends>> {
		return apiClient.get<NutritionTrends>("/statistics/nutrition-trends", params as unknown as Record<string, unknown>);
	}
}

export const statisticsService = new StatisticsService();