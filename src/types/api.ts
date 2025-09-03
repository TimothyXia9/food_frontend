export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
}

export interface User {
	id: number;
	username: string;
	email: string;
	nickname: string;
}

export interface UserProfile {
	date_of_birth?: string;
	gender?: string;
	height?: number;
	weight?: number;
	daily_calorie_goal?: number;
}

export interface AuthData {
	user: User;
	access: string;
	refresh: string;
	token?: string; // For email verification response
	refresh_token?: string; // For email verification response
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	nickname: string;
}

export interface RefreshTokenRequest {
	refresh: string;
}

export interface Food {
	id: number;
	name: string;
	brand?: string;
	barcode?: string;
	serving_size: number;
	calories_per_100g: number;
	protein_per_100g: number;
	fat_per_100g: number;
	carbs_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
	is_custom: boolean;
	created_by?: number;
	aliases?: string[];
	is_usda?: boolean;
	fdc_id?: string | number;
}

export interface FoodSearchParams {
	query: string;
	page?: number;
	page_size?: number;
}

export interface FoodSearchResult {
	foods: Food[];
	total_count: number;
	page: number;
	page_size: number;
	total_pages: number;
	query: string;
}

export interface CreateFoodRequest {
	name: string;
	brand?: string;
	serving_size: number;
	calories_per_100g: number;
	protein_per_100g: number;
	fat_per_100g: number;
	carbs_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
	aliases?: string[];
}

export interface DeleteFoodResponse {
	removed_from_meals: boolean;
	meal_count: number;
	meal_foods_count: number;
}

export interface MealFood {
	id: number;
	food: Food;
	quantity: number;
	calories: number;
	protein: number;
	fat: number;
	carbs: number;
}

export interface Meal {
	id: number;
	meal_type: "breakfast" | "lunch" | "dinner" | "snack";
	name: string;
	notes?: string;
	foods: MealFood[];
	total_calories: number;
	created_at: string;
}

export interface MealsByDate {
	date: string;
	meals: Meal[];
}

export interface CreateMealRequest {
	date: string;
	meal_type: "breakfast" | "lunch" | "dinner" | "snack";
	name: string;
	notes?: string;
	foods: {
		food_id: number;
		quantity: number;
		// USDA food support - passed to backend for automatic food creation
		fdc_id?: string | number;
		usda_fdc_id?: string | number;
		name?: string; // fallback name if USDA fetch fails
	}[];
}

export interface AddFoodToMealRequest {
	food_id: number;
	quantity: number;
	// USDA food support - passed to backend for automatic food creation
	fdc_id?: string | number;
	usda_fdc_id?: string | number;
	name?: string; // fallback name if USDA fetch fails
}

export interface UpdateFoodInMealRequest {
	quantity: number;
}

export interface DailySummary {
	date: string;
	total_calories: number;
	total_protein: number;
	total_fat: number;
	total_carbs: number;
	total_fiber: number;
	calorie_goal: number;
	remaining_calories: number;
	weight_recorded?: number;
	meals_summary: {
		breakfast: { calories: number; meal_count: number };
		lunch: { calories: number; meal_count: number };
		dinner: { calories: number; meal_count: number };
		snack: { calories: number; meal_count: number };
	};
}

export interface UpdateWeightRequest {
	date: string;
	weight: number;
}

export interface DailySummaryData {
	date: string;
	total_calories: number;
	calorie_goal: number;
	weight?: number;
}

export interface WeeklySummary {
	week_start: string;
	week_end: string;
	daily_summaries: DailySummaryData[];
	weekly_stats: {
		avg_calories: number;
		avg_weight: number;
		total_meals: number;
		days_on_target: number;
	};
}

export interface ImageUpload {
	id: number;
	filename: string;
	file_size: number;
	processing_status: "pending" | "processing" | "completed" | "failed";
	uploaded_at: string;
}

export interface RecognitionResult {
	id: number;
	food: Food;
	confidence_score: number;
	estimated_quantity: number;
	is_confirmed: boolean;
}

export interface ImageRecognition {
	image_id: number;
	processing_status: "pending" | "processing" | "completed" | "failed";
	results: RecognitionResult[];
}

export interface ConfirmRecognitionRequest {
	confirmed: boolean;
	adjusted_quantity: number;
}

export interface AddRecognitionToMealRequest {
	meal_id: number;
	quantity: number;
}

export interface SearchHistory {
	id: number;
	search_query: string;
	search_type: "text" | "image";
	results_count: number;
	created_at: string;
}

export interface MonthlySummary {
	year: number;
	month: number;
	daily_summaries: DailySummaryData[];
	monthly_stats: {
		avg_calories: number;
		avg_weight: number;
		total_meals: number;
		days_on_target: number;
	};
}

export interface NutritionTrends {
	period: "week" | "month";
	start_date: string;
	end_date: string;
	trends: {
		calories: { date: string; value: number }[];
		protein: { date: string; value: number }[];
		fat: { date: string; value: number }[];
		carbs: { date: string; value: number }[];
	};
}

// USDA API related types
export interface USDAFoodSearchParams {
	query: string;
	page?: number;
	page_size?: number;
}

export interface USDAFoodItem {
	fdc_id: number;
	description: string;
	data_type: string;
	brand_owner: string;
	ingredients: string;
}

export interface USDAFoodSearchResult {
	total_results: number;
	foods: USDAFoodItem[];
}

export interface USDANutritionData {
	food_description: string;
	fdc_id: number;
	brand_owner?: string;
	nutrients: {
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
		fiber: number;
		sugar: number;
		sodium: number;
	};
}

export interface CreateFoodFromUSDARequest {
	fdc_id: number;
}

// Two-stage food analysis types
export interface FoodAnalysisStage1 {
	food_types: Array<{
		name: string;
		name_chinese: string;
		name_english: string;
		usda_search_term: string;
		confidence: number;
		category: string;
	}>;
}

export interface FoodAnalysisStage2 {
	food_portions: Array<{
		name: string;
		estimated_grams: number;
		portion_description?: string;
		cooking_method?: string;
	}>;
}

export interface USDANutritionInfo {
	food_name: string;
	usda_description: string;
	fdc_id: number | null;
	calories_per_100g: number;
	protein_per_100g: number;
	fat_per_100g: number;
	carbs_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
	data_quality: "usda" | "default" | "unavailable";
	data_source?: string;
}

export interface FoodAnalysisStage3 {
	nutrition_data: USDANutritionInfo[];
}

export interface TwoStageAnalysisResult {
	success: boolean;
	stage_1: FoodAnalysisStage1;
	stage_2: FoodAnalysisStage2;
	stage_3: FoodAnalysisStage3;
	error?: string;
}
