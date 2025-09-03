import React from "react";
import { useTranslation } from "react-i18next";
import { NutritionDataStatus as ValidationStatus } from "../utils/nutritionValidation";

interface NutritionDataStatusProps {
	status: ValidationStatus;
	className?: string;
	showDetails?: boolean;
}

const NutritionDataStatus: React.FC<NutritionDataStatusProps> = ({
	status,
	className = "",
	showDetails = false,
}) => {
	const { t } = useTranslation();

	const getStatusIcon = () => {
		switch (status.confidence) {
			case "high":
				return "✅";
			case "medium":
				return "⚠️";
			case "low":
				return "❌";
			default:
				return "❓";
		}
	};

	const getStatusColor = () => {
		switch (status.confidence) {
			case "high":
				return "text-green-600";
			case "medium":
				return "text-yellow-600";
			case "low":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	const getStatusBackground = () => {
		switch (status.confidence) {
			case "high":
				return "bg-green-50 border-green-200";
			case "medium":
				return "bg-yellow-50 border-yellow-200";
			case "low":
				return "bg-red-50 border-red-200";
			default:
				return "bg-gray-50 border-gray-200";
		}
	};

	const getDataQualityText = () => {
		switch (status.dataQuality) {
			case "usda":
				return t("nutrition.dataQuality.usda");
			case "default":
				return t("nutrition.dataQuality.default");
			case "unavailable":
				return t("nutrition.dataQuality.unavailable");
			default:
				return t("nutrition.dataQuality.unknown");
		}
	};

	const getConfidenceText = () => {
		switch (status.confidence) {
			case "high":
				return t("nutrition.confidence.high");
			case "medium":
				return t("nutrition.confidence.medium");
			case "low":
				return t("nutrition.confidence.low");
			default:
				return t("nutrition.confidence.unknown");
		}
	};

	return (
		<div className={`inline-flex items-center ${className}`}>
			<span className={`mr-1 ${getStatusColor()}`} title={getConfidenceText()}>
				{getStatusIcon()}
			</span>

			{showDetails && (
				<div
					className={`text-xs px-2 py-1 rounded border ${getStatusBackground()}`}
				>
					<div className="flex items-center space-x-2">
						<span className={`font-medium ${getStatusColor()}`}>
							{getDataQualityText()}
						</span>
						<span className="text-gray-500">•</span>
						<span className={getStatusColor()}>{getConfidenceText()}</span>
					</div>

					{status.issues.length > 0 && (
						<div className="mt-1 text-gray-600">
							<div className="font-medium text-xs">{t("nutrition.issues")}:</div>
							<ul className="list-disc list-inside text-xs">
								{status.issues.map((issue, index) => (
									<li key={index} className="text-gray-500">
										{issue}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default NutritionDataStatus;
