import { apiClient } from "../utils/api";
import { ApiResponse, ImageUpload, ImageRecognition } from "../types/api";

class ImageService {
	async uploadImage(file: File, notes?: string): Promise<ApiResponse<ImageUpload>> {
		const additionalData = notes ? { notes } : undefined;
		return apiClient.uploadFile<ImageUpload>("/images/upload/", file, additionalData);
	}

	async analyzeImage(imageId: number, analysisType: "full" | "quick" = "full"): Promise<ApiResponse<{ analysis_id: number; status: string; estimated_completion: string }>> {
		return apiClient.post<{ analysis_id: number; status: string; estimated_completion: string }>("/images/analyze/", {
			image_id: imageId,
			analysis_type: analysisType,
		});
	}

	async getImageResults(imageId: number): Promise<ApiResponse<ImageRecognition>> {
		return apiClient.get<ImageRecognition>(`/images/${imageId}/results/`);
	}

	async confirmRecognitionResults(data: { result_id: number; is_confirmed: boolean; corrections?: any[] }): Promise<ApiResponse<{ result_id: number; confirmed: boolean; corrections_applied: number }>> {
		return apiClient.post<{ result_id: number; confirmed: boolean; corrections_applied: number }>("/images/confirm/", data);
	}

	async createMealFromImage(data: { image_id: number; meal_type: string; date?: string; meal_name?: string }): Promise<ApiResponse<{ meal_id: number; image_id: number; foods_added: number; total_calories: number }>> {
		return apiClient.post<{ meal_id: number; image_id: number; foods_added: number; total_calories: number }>("/images/create-meal/", data);
	}

	async deleteImage(imageId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/images/${imageId}/delete/`);
	}

	async getUserImages(params?: { page?: number; page_size?: number; status?: string }): Promise<ApiResponse<{ images: ImageUpload[]; total_count: number; page: number; page_size: number; total_pages: number }>> {
		return apiClient.get<{ images: ImageUpload[]; total_count: number; page: number; page_size: number; total_pages: number }>("/images/list/", params as unknown as Record<string, unknown>);
	}
}

export const imageService = new ImageService();
