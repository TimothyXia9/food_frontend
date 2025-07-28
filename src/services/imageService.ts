import { apiClient } from "../utils/api";
import { ApiResponse, ImageUpload, ImageRecognition } from "../types/api";

class ImageService {
	async uploadImage(file: File, notes?: string): Promise<ApiResponse<ImageUpload>> {
		const additionalData = notes ? { notes } : undefined;
		return apiClient.uploadFile<ImageUpload>("/images/upload/", file, additionalData);
	}

	async analyzeImage(
		imageId: number,
		_analysisType: "full" | "quick" = "full"
	): Promise<ApiResponse<{ analysis_id: number; status: string; keywords?: string[] }>> {
		return apiClient.post<{ analysis_id: number; status: string; keywords?: string[] }>(
			"/images/analyze/",
			{
				image_id: imageId,
			}
		);
	}

	async analyzeImageStreaming(
		imageId: number,
		onProgress: (data: {
			step: string;
			message?: string;
			progress?: number;
			foods?: any[];
			portions?: any[];
			stage_1?: any;
			stage_2?: any;
			error?: string;
		}) => void,
		abortController?: AbortController
	): Promise<{ success: boolean; finalResult?: any; error?: string; cancelled?: boolean }> {
		try {
			// Use the unified API client for streaming requests with token handling
			const response = await apiClient.streamingRequest(
				"/images/analyze-stream/",
				{ image_id: imageId },
				abortController
			);

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Unable to read response stream");
			}

			const decoder = new TextDecoder();
			let finalResult: any = null;

			try {
				let reading = true;
				while (reading) {
					// Check if cancelled
					if (abortController?.signal.aborted) {
						throw new Error("Analysis cancelled by user");
					}

					const { done, value } = await reader.read();
					if (done) {
						reading = false;
						break;
					}

					const chunk = decoder.decode(value);
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const data = JSON.parse(line.slice(6));
								onProgress(data);

								if (data.step === "complete") {
									finalResult = data;
								}

								if (data.step === "error") {
									throw new Error(data.error || "Analysis failed");
								}
							} catch (parseError) {
								console.warn("Failed to parse SSE data:", line, parseError);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}

			return { success: true, finalResult };
		} catch (error) {
			console.error("Streaming analysis error:", error);

			// Check if it was cancelled
			if (
				abortController?.signal.aborted ||
				(error instanceof Error && error.message.includes("cancelled"))
			) {
				return {
					success: false,
					cancelled: true,
					error: "Analysis cancelled by user",
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async getImageResults(imageId: number): Promise<ApiResponse<ImageRecognition>> {
		return apiClient.get<ImageRecognition>(`/images/${imageId}/results/`);
	}

	async confirmRecognitionResults(data: {
		result_id: number;
		is_confirmed: boolean;
		corrections?: any[];
	}): Promise<
		ApiResponse<{ result_id: number; confirmed: boolean; corrections_applied: number }>
	> {
		return apiClient.post<{
			result_id: number;
			confirmed: boolean;
			corrections_applied: number;
		}>("/images/confirm/", data);
	}

	async createMealFromImage(data: {
		image_id: number;
		meal_type: string;
		date?: string;
		meal_name?: string;
	}): Promise<
		ApiResponse<{
			meal_id: number;
			image_id: number;
			foods_added: number;
			total_calories: number;
		}>
	> {
		return apiClient.post<{
			meal_id: number;
			image_id: number;
			foods_added: number;
			total_calories: number;
		}>("/images/create-meal/", data);
	}

	async deleteImage(imageId: number): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/images/${imageId}/delete/`);
	}

	async getUserImages(params?: { page?: number; page_size?: number; status?: string }): Promise<
		ApiResponse<{
			images: ImageUpload[];
			total_count: number;
			page: number;
			page_size: number;
			total_pages: number;
		}>
	> {
		return apiClient.get<{
			images: ImageUpload[];
			total_count: number;
			page: number;
			page_size: number;
			total_pages: number;
		}>("/images/list/", params as unknown as Record<string, unknown>);
	}

	async detectBarcodes(imageId: number): Promise<ApiResponse<{
		image_id: number;
		total_barcodes: number;
		food_barcodes: number;
		barcodes: Array<{
			data: string;
			type: string;
			quality?: number;
			orientation?: string;
			rect: { left: number; top: number; width: number; height: number };
			polygon?: Array<[number, number]>;
			is_food_barcode: boolean;
			formatted_data: string;
		}>;
		food_barcodes_only: Array<{
			data: string;
			type: string;
			quality?: number;
			orientation?: string;
			rect: { left: number; top: number; width: number; height: number };
			polygon?: Array<[number, number]>;
			is_food_barcode: boolean;
			formatted_data: string;
		}>;
	}>> {
		return apiClient.post<{
			image_id: number;
			total_barcodes: number;
			food_barcodes: number;
			barcodes: Array<{
				data: string;
				type: string;
				quality?: number;
				orientation?: string;
				rect: { left: number; top: number; width: number; height: number };
				polygon?: Array<[number, number]>;
				is_food_barcode: boolean;
				formatted_data: string;
			}>;
			food_barcodes_only: Array<{
				data: string;
				type: string;
				quality?: number;
				orientation?: string;
				rect: { left: number; top: number; width: number; height: number };
				polygon?: Array<[number, number]>;
				is_food_barcode: boolean;
				formatted_data: string;
			}>;
		}>("/images/detect-barcodes/", { image_id: imageId });
	}

	async searchUSDAByBarcode(barcode: string): Promise<ApiResponse<{
		barcode: string;
		usda_results: Array<{
			fdc_id: number;
			description: string;
			data_type: string;
			brand_owner: string;
			ingredients: string;
			gtin_upc: string;
			serving_size: string;
			serving_size_unit: string;
		}>;
		total_results: number;
	}>> {
		return apiClient.post<{
			barcode: string;
			usda_results: Array<{
				fdc_id: number;
				description: string;
				data_type: string;
				brand_owner: string;
				ingredients: string;
				gtin_upc: string;
				serving_size: string;
				serving_size_unit: string;
			}>;
			total_results: number;
		}>("/images/search-usda-barcode/", { barcode });
	}

	async analyzeImageWithBarcode(imageId: number): Promise<ApiResponse<{
		image_id: number;
		status: string;
		barcode_detection: {
			total_barcodes: number;
			food_barcodes: number;
			barcodes: Array<{
				data: string;
				type: string;
				quality?: number;
				orientation?: string;
				rect: { left: number; top: number; width: number; height: number };
				polygon?: Array<[number, number]>;
				is_food_barcode: boolean;
				formatted_data: string;
			}>;
		};
		usda_barcode_results: {
			total_products: number;
			products: Array<{
				fdc_id: number;
				description: string;
				data_type: string;
				brand_owner: string;
				ingredients: string;
				gtin_upc: string;
				serving_size: string;
				serving_size_unit: string;
				source_barcode: string;
				barcode_info: {
					data: string;
					type: string;
					quality?: number;
					orientation?: string;
					rect: { left: number; top: number; width: number; height: number };
					polygon?: Array<[number, number]>;
					is_food_barcode: boolean;
					formatted_data: string;
				};
			}>;
		};
		openfoodfacts_results: {
			total_products: number;
			products: Array<{
				barcode: string;
				product_name: string;
				product_name_en: string;
				brands: string;
				categories: string;
				ingredients_text: string;
				serving_size: string;
				serving_quantity: string;
				nutrition_grade: string;
				image_url: string;
				image_front_url: string;
				nutrition_per_100g: Record<string, number>;
				data_source: string;
				source_barcode: string;
				barcode_info: {
					data: string;
					type: string;
					quality?: number;
					orientation?: string;
					rect: { left: number; top: number; width: number; height: number };
					polygon?: Array<[number, number]>;
					is_food_barcode: boolean;
					formatted_data: string;
				};
			}>;
		};
		food_analysis: {
			success: boolean;
			stage_1: { food_types: Array<{ name: string; confidence: number }> };
			stage_2: { food_portions: Array<{ name: string; estimated_grams: number; cooking_method?: string }> };
		};
	}>> {
		return apiClient.post<{
			image_id: number;
			status: string;
			barcode_detection: {
				total_barcodes: number;
				food_barcodes: number;
				barcodes: Array<{
					data: string;
					type: string;
					quality?: number;
					orientation?: string;
					rect: { left: number; top: number; width: number; height: number };
					polygon?: Array<[number, number]>;
					is_food_barcode: boolean;
					formatted_data: string;
				}>;
			};
			usda_barcode_results: {
				total_products: number;
				products: Array<{
					fdc_id: number;
					description: string;
					data_type: string;
					brand_owner: string;
					ingredients: string;
					gtin_upc: string;
					serving_size: string;
					serving_size_unit: string;
					source_barcode: string;
					barcode_info: {
						data: string;
						type: string;
						quality?: number;
						orientation?: string;
						rect: { left: number; top: number; width: number; height: number };
						polygon?: Array<[number, number]>;
						is_food_barcode: boolean;
						formatted_data: string;
					};
				}>;
			};
			openfoodfacts_results: {
				total_products: number;
				products: Array<{
					barcode: string;
					product_name: string;
					product_name_en: string;
					brands: string;
					categories: string;
					ingredients_text: string;
					serving_size: string;
					serving_quantity: string;
					nutrition_grade: string;
					image_url: string;
					image_front_url: string;
					nutrition_per_100g: Record<string, number>;
					data_source: string;
					source_barcode: string;
					barcode_info: {
						data: string;
						type: string;
						quality?: number;
						orientation?: string;
						rect: { left: number; top: number; width: number; height: number };
						polygon?: Array<[number, number]>;
						is_food_barcode: boolean;
						formatted_data: string;
					};
				}>;
			};
			food_analysis: {
				success: boolean;
				stage_1: { food_types: Array<{ name: string; confidence: number }> };
				stage_2: { food_portions: Array<{ name: string; estimated_grams: number; cooking_method?: string }> };
			};
		}>("/images/analyze-with-barcode/", { image_id: imageId });
	}

	async searchOpenFoodFactsByBarcode(barcode: string): Promise<ApiResponse<{
		barcode: string;
		product: {
			barcode: string;
			product_name: string;
			product_name_en: string;
			brands: string;
			categories: string;
			ingredients_text: string;
			serving_size: string;
			serving_quantity: string;
			nutrition_grade: string;
			image_url: string;
			image_front_url: string;
			nutrition_per_100g: Record<string, number>;
			data_source: string;
		} | null;
	}>> {
		return apiClient.post<{
			barcode: string;
			product: {
				barcode: string;
				product_name: string;
				product_name_en: string;
				brands: string;
				categories: string;
				ingredients_text: string;
				serving_size: string;
				serving_quantity: string;
				nutrition_grade: string;
				image_url: string;
				image_front_url: string;
				nutrition_per_100g: Record<string, number>;
				data_source: string;
			} | null;
		}>("/images/search-openfoodfacts-barcode/", { barcode });
	}

	async searchBarcodeCombined(barcode: string): Promise<ApiResponse<{
		barcode: string;
		usda_results: Array<{
			fdc_id: number;
			description: string;
			data_type: string;
			brand_owner: string;
			ingredients: string;
			gtin_upc: string;
			serving_size: string;
			serving_size_unit: string;
		}>;
		openfoodfacts_result: {
			barcode: string;
			product_name: string;
			product_name_en: string;
			brands: string;
			categories: string;
			ingredients_text: string;
			serving_size: string;
			serving_quantity: string;
			nutrition_grade: string;
			image_url: string;
			image_front_url: string;
			nutrition_per_100g: Record<string, number>;
			data_source: string;
		} | null;
		total_sources: number;
	}>> {
		return apiClient.post<{
			barcode: string;
			usda_results: Array<{
				fdc_id: number;
				description: string;
				data_type: string;
				brand_owner: string;
				ingredients: string;
				gtin_upc: string;
				serving_size: string;
				serving_size_unit: string;
			}>;
			openfoodfacts_result: {
				barcode: string;
				product_name: string;
				product_name_en: string;
				brands: string;
				categories: string;
				ingredients_text: string;
				serving_size: string;
				serving_quantity: string;
				nutrition_grade: string;
				image_url: string;
				image_front_url: string;
				nutrition_per_100g: Record<string, number>;
				data_source: string;
			} | null;
			total_sources: number;
		}>("/images/search-barcode-combined/", { barcode });
	}

	async createFoodFromBarcode(barcode: string): Promise<ApiResponse<{
		food: {
			id: number;
			name: string;
			brand: string;
			barcode: string;
			serving_size: number;
			serving_unit: string;
			calories_per_100g: number;
			protein_per_100g: number;
			fat_per_100g: number;
			carbs_per_100g: number;
			fiber_per_100g: number;
			sugar_per_100g: number;
			sodium_per_100g: number;
			description: string;
			ingredients: string;
			data_source: string;
			nutrition_grade?: string;
			image_url?: string;
		};
		message: string;
		is_existing?: boolean;
	}>> {
		return apiClient.post<{
			food: {
				id: number;
				name: string;
				brand: string;
				barcode: string;
				serving_size: number;
				serving_unit: string;
				calories_per_100g: number;
				protein_per_100g: number;
				fat_per_100g: number;
				carbs_per_100g: number;
				fiber_per_100g: number;
				sugar_per_100g: number;
				sodium_per_100g: number;
				description: string;
				ingredients: string;
				data_source: string;
				nutrition_grade?: string;
				image_url?: string;
			};
			message: string;
			is_existing?: boolean;
		}>("/images/create-food-from-barcode/", { barcode });
	}

}

export const imageService = new ImageService();
