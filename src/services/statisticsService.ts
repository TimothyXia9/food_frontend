import { apiClient } from "../utils/api";
import {
	ApiResponse,
	DailySummary,
} from "../types/api";

interface DailySummaryParams {
  date?: string;
}

interface NutritionStatsParams {
  start_date?: string;
  end_date?: string;
  period?: "weekly" | "monthly";
}

class StatisticsService {
	async getDailySummary(params: DailySummaryParams = {}): Promise<ApiResponse<DailySummary>> {
		return apiClient.get<DailySummary>("/meals/daily-summary/", params as unknown as Record<string, unknown>);
	}

	async getNutritionStats(params: NutritionStatsParams = {}): Promise<ApiResponse<{
		period: string;
		start_date: string;
		end_date: string;
		average_calories: number;
		average_protein: number;
		average_fat: number;
		average_carbs: number;
		daily_stats: Array<{
			date: string;
			calories: number;
			protein: number;
			fat: number;
			carbs: number;
		}>;
	}>> {
		return apiClient.get<{
			period: string;
			start_date: string;
			end_date: string;
			average_calories: number;
			average_protein: number;
			average_fat: number;
			average_carbs: number;
			daily_stats: Array<{
				date: string;
				calories: number;
				protein: number;
				fat: number;
				carbs: number;
			}>;
		}>("/meals/nutrition-stats/", params as unknown as Record<string, unknown>);
	}

	async recordWeight(data: { weight: number; date?: string; notes?: string }): Promise<ApiResponse<{
		id: number;
		weight: number;
		date: string;
		notes?: string;
	}>> {
		return apiClient.post<{
			id: number;
			weight: number;
			date: string;
			notes?: string;
		}>("/meals/record-weight/", data);
	}
}

export const statisticsService = new StatisticsService();