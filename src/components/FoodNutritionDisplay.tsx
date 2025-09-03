import React from "react";
import { useTranslation } from "react-i18next";
import NutritionDataStatus from "./NutritionDataStatus";
import { NutritionDataStatus as ValidationStatus } from "../utils/nutritionValidation";

interface FoodNutritionDisplayProps {
	food: {
		name: string;
		calories_per_100g: number;
		protein_per_100g: number;
		fat_per_100g: number;
		carbs_per_100g: number;
		fiber_per_100g: number;
		sugar_per_100g: number;
		sodium_per_100g: number;
		usda_description?: string;
		fdc_id?: number | null;
		data_quality?: "usda" | "default" | "unavailable";
		data_source?: string;
	};
	portionGrams: number;
	nutritionStatus?: ValidationStatus;
	showDetails?: boolean;
}

const FoodNutritionDisplay: React.FC<FoodNutritionDisplayProps> = ({
	food,
	portionGrams,
	nutritionStatus,
	showDetails = false,
}) => {
	const { t } = useTranslation();

	const calculatePortionValue = (per100g: number) => {
		return Math.round(((per100g * portionGrams) / 100) * 10) / 10;
	};

	const getQualityIndicatorStyle = () => {
		if (!nutritionStatus) return "";
		switch (nutritionStatus.confidence) {
			case "high":
				return "border-green-300 bg-green-50";
			case "medium":
				return "border-yellow-300 bg-yellow-50";
			case "low":
				return "border-red-300 bg-red-50";
			default:
				return "border-gray-300 bg-gray-50";
		}
	};

	return (
		<div className={`p-4 rounded-lg border ${getQualityIndicatorStyle()}`}>
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-medium text-gray-900">{food.name}</h3>
				{nutritionStatus && (
					<NutritionDataStatus 
						status={nutritionStatus} 
						showDetails={showDetails} 
					/>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3 text-sm">
				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.calories")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.calories_per_100g)} kcal
					</span>
				</div>
				
				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.protein")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.protein_per_100g)}g
					</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.fat")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.fat_per_100g)}g
					</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.carbs")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.carbs_per_100g)}g
					</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.fiber")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.fiber_per_100g)}g
					</span>
				</div>

				<div className="flex justify-between">
					<span className="text-gray-600">
						{t("nutrition.sodium")}:
					</span>
					<span className="font-medium">
						{calculatePortionValue(food.sodium_per_100g)}mg
					</span>
				</div>
			</div>

			{showDetails && food.usda_description && (
				<div className="mt-3 pt-3 border-t border-gray-200">
					<p className="text-xs text-gray-500">
						<strong>{t("nutrition.usdaDescription")}:</strong>{" "}
						{food.usda_description}
					</p>
					{food.fdc_id && (
						<p className="text-xs text-gray-500 mt-1">
							<strong>{t("nutrition.fdcId")}:</strong> {food.fdc_id}
						</p>
					)}
					{food.data_source && (
						<p className="text-xs text-gray-500 mt-1">
							<strong>{t("nutrition.dataSource")}:</strong> {food.data_source}
						</p>
					)}
				</div>
			)}

			<div className="mt-2 text-xs text-gray-400">
				{t("nutrition.portionSize")}: {portionGrams}g
			</div>
		</div>
	);
};

export default FoodNutritionDisplay;