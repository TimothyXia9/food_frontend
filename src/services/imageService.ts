import { apiClient } from "../utils/api";
import { ApiResponse, ImageUpload, ImageRecognition, ConfirmRecognitionRequest, AddRecognitionToMealRequest, SearchHistory } from "../types/api";

class ImageService {
	async uploadImage(file: File, mealId?: number): Promise<ApiResponse<{ image: ImageUpload }>> {
		const additionalData = mealId ? { meal_id: mealId.toString() } : undefined;
		return apiClient.uploadFile<{ image: ImageUpload }>("/images/upload", file, additionalData);
	}

	async getRecognitionResults(imageId: number): Promise<ApiResponse<ImageRecognition>> {
		return apiClient.get<ImageRecognition>(`/images/${imageId}/recognition`);
	}

	async confirmRecognitionResult(imageId: number, resultId: number, data: ConfirmRecognitionRequest): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`/images/${imageId}/recognition/${resultId}/confirm`, data);
	}

	async addRecognitionResultToMeal(imageId: number, resultId: number, data: AddRecognitionToMealRequest): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`/images/${imageId}/recognition/${resultId}/add-to-meal`, data);
	}

	async getSearchHistory(limit?: number): Promise<ApiResponse<SearchHistory[]>> {
		const params = limit ? { limit } : {};
		return apiClient.get<SearchHistory[]>("/search/history", params);
	}
}

export const imageService = new ImageService();
