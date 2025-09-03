import { USDANutritionInfo } from "../types/api";

export interface NutritionDataStatus {
	isValid: boolean;
	dataQuality: "usda" | "default" | "unavailable";
	issues: string[];
	confidence: "high" | "medium" | "low";
}

/**
 * Validate USDA nutrition data and determine data quality
 */
export function validateNutritionData(
	nutrition: USDANutritionInfo
): NutritionDataStatus {
	const issues: string[] = [];
	const dataQuality = nutrition.data_quality || "unavailable";
	let confidence: "high" | "medium" | "low" = "medium";

	// Check for suspicious values
	if (nutrition.calories_per_100g <= 0 || nutrition.calories_per_100g > 900) {
		issues.push("Unusual calorie content");
	}

	if (nutrition.protein_per_100g < 0 || nutrition.protein_per_100g > 100) {
		issues.push("Unusual protein content");
	}

	if (nutrition.fat_per_100g < 0 || nutrition.fat_per_100g > 100) {
		issues.push("Unusual fat content");
	}

	if (nutrition.carbs_per_100g < 0 || nutrition.carbs_per_100g > 100) {
		issues.push("Unusual carbohydrate content");
	}

	// Check if total macros exceed 100g (allowing some tolerance for measurement error)
	const totalMacros =
		nutrition.protein_per_100g +
		nutrition.fat_per_100g +
		nutrition.carbs_per_100g;
	if (totalMacros > 120) {
		issues.push("Total macronutrients exceed expected range");
	}

	// Determine confidence level
	if (nutrition.fdc_id && dataQuality === "usda") {
		confidence = issues.length === 0 ? "high" : "medium";
	} else if (dataQuality === "default") {
		confidence = "low";
		issues.push("Using estimated default values");
	} else if (dataQuality === "unavailable") {
		confidence = "low";
		issues.push("USDA data unavailable");
	}

	// Check for missing USDA description or ID
	if (!nutrition.fdc_id || !nutrition.usda_description) {
		if (dataQuality === "usda") {
			issues.push("Missing USDA reference data");
			confidence = "low";
		}
	}

	return {
		isValid: issues.length === 0 && dataQuality === "usda",
		dataQuality: dataQuality as "usda" | "default" | "unavailable",
		issues,
		confidence,
	};
}

/**
 * Get default nutrition data with quality markers
 */
export function getDefaultNutritionData(foodName: string): USDANutritionInfo {
	return {
		food_name: foodName,
		usda_description: "Default estimate - USDA data unavailable",
		fdc_id: null,
		calories_per_100g: 100,
		protein_per_100g: 10,
		fat_per_100g: 5,
		carbs_per_100g: 20,
		fiber_per_100g: 2,
		sugar_per_100g: 5,
		sodium_per_100g: 100,
		data_quality: "default",
		data_source: "Default estimates",
	};
}

/**
 * Merge nutrition data with portion information
 */
export function calculateNutritionPerPortion(
	nutrition: USDANutritionInfo,
	portionGrams: number
): USDANutritionInfo & { portion_grams: number } {
	const multiplier = portionGrams / 100;

	return {
		...nutrition,
		portion_grams: portionGrams,
		calories_per_100g:
			Math.round(nutrition.calories_per_100g * multiplier * 10) / 10,
		protein_per_100g:
			Math.round(nutrition.protein_per_100g * multiplier * 10) / 10,
		fat_per_100g: Math.round(nutrition.fat_per_100g * multiplier * 10) / 10,
		carbs_per_100g: Math.round(nutrition.carbs_per_100g * multiplier * 10) / 10,
		fiber_per_100g: Math.round(nutrition.fiber_per_100g * multiplier * 10) / 10,
		sugar_per_100g: Math.round(nutrition.sugar_per_100g * multiplier * 10) / 10,
		sodium_per_100g: Math.round(nutrition.sodium_per_100g * multiplier * 10) / 10,
	};
}
