import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentLocalDate } from "../utils/timezone";
import ImageUpload from "../components/ImageUpload";
import BarcodeScanner from "../components/BarcodeScanner";
import { useNotification } from "../contexts/NotificationContext";
import { foodService } from "../services/foodService";

interface DashboardProps {
	onLoginRequired: () => void;
}

const Dashboard = ({ onLoginRequired }: DashboardProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const { showSuccess, showError } = useNotification();
	const todayDate = new Date(getCurrentLocalDate()).toLocaleDateString("zh-CN");

	// Image recognition related state
	const [imageRecognitionHistory, setImageRecognitionHistory] = useState<any[]>(
		[]
	);
	const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(
		null
	);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);

	// Streaming analysis state
	const [analysisProgress, setAnalysisProgress] = useState<number>(0);
	const [analysisStep, setAnalysisStep] = useState<string>("");
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
	const [detectedFoods, setDetectedFoods] = useState<any[]>([]);
	const [estimatedPortions, setEstimatedPortions] = useState<any[]>([]);

	// Barcode scanning state
	const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
	const [barcodeResults, setBarcodeResults] = useState<any>(null);

	// Load recognition results from localStorage on component mount
	useEffect(() => {
		const loadRecognitionResultsFromStorage = () => {
			try {
				const savedResults = localStorage.getItem("dashboardEstimatedPortions");
				const savedImagePreview = localStorage.getItem("dashboardImagePreview");
				const savedImageId = localStorage.getItem("dashboardImageId");

				if (savedResults) {
					const parsedResults = JSON.parse(savedResults);
					if (parsedResults.length > 0) {
						setEstimatedPortions(parsedResults);
					}
				}

				if (savedImagePreview && savedImagePreview !== "null") {
					setCurrentImagePreview(savedImagePreview);
				}

				if (savedImageId && savedImageId !== "null") {
					setCurrentImageId(parseInt(savedImageId));
				}
			} catch (error) {
				console.error("Error loading recognition results from storage:", error);
			}
		};

		loadRecognitionResultsFromStorage();
	}, []);

	// Cleanup resources
	useEffect(() => {
		return () => {
			// Cleanup preview URL on component unmount
			if (currentImagePreview) {
				URL.revokeObjectURL(currentImagePreview);
			}
		};
	}, [currentImagePreview]);

	// Check URL parameters, open scanner if barcode mode is set
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const mode = urlParams.get("mode");

		if (mode === "barcode") {
			setShowBarcodeScanner(true);
			// Clear URL parameters
			window.history.replaceState(null, "", window.location.pathname);
		}
	}, []);

	// Handle image preview (display immediately)
	const handleImagePreview = (imagePreview: string) => {
		// Clear previous preview URL
		if (currentImagePreview) {
			URL.revokeObjectURL(currentImagePreview);
		}
		setCurrentImagePreview(imagePreview);
		// Clear previous recognition results
		setDetectedFoods([]);
		setEstimatedPortions([]);
		setAnalysisProgress(0);
		setAnalysisStep("");
		setIsAnalyzing(true);
	};

	// Handle streaming analysis progress
	const handleStreamingProgress = (data: {
		step: string;
		message?: string;
		progress?: number;
		foods?: any[];
		portions?: any[];
		stage_1?: any;
		stage_2?: any;
	}) => {
		console.log("Streaming progress:", data);

		setAnalysisStep(data.step);

		if (data.progress !== undefined) {
			setAnalysisProgress(data.progress);
		}

		// Check if there's portions data (regardless of stage)
		if (data.portions) {
			setEstimatedPortions(data.portions);
		}
		if (data.stage_2?.portions) {
			setEstimatedPortions(data.stage_2.portions);
		}
		// Check food_portions field
		if (data.stage_2?.food_portions) {
			setEstimatedPortions(data.stage_2.food_portions);
		}

		switch (data.step) {
			case "start":
				setIsAnalyzing(true);
				break;

			case "food_detection":
				// Detecting food
				break;

			case "food_detection_complete":
				if (data.foods) {
					setDetectedFoods(data.foods);
				}
				break;

			case "portion_estimation":
				// Estimating portions
				// 这里可能也会有 portions 数据
				if (data.portions) {
					setEstimatedPortions(data.portions);
				}
				break;

			case "complete":
				setIsAnalyzing(false);
				if (data.stage_1?.food_types) {
					setDetectedFoods(data.stage_1.food_types);
				}
				if (data.stage_2?.portions) {
					setEstimatedPortions(data.stage_2.portions);
					// Save recognition results to localStorage
					try {
						localStorage.setItem(
							"dashboardEstimatedPortions",
							JSON.stringify(data.stage_2.portions)
						);
						if (currentImagePreview) {
							localStorage.setItem("dashboardImagePreview", currentImagePreview);
						}
						if (currentImageId) {
							localStorage.setItem("dashboardImageId", currentImageId.toString());
						}
					} catch (error) {
						console.error("Error saving recognition results:", error);
					}
				}
				// 也检查 food_portions 字段
				if (data.stage_2?.food_portions) {
					setEstimatedPortions(data.stage_2.food_portions);
					// Save recognition results to localStorage
					try {
						localStorage.setItem(
							"dashboardEstimatedPortions",
							JSON.stringify(data.stage_2.food_portions)
						);
						if (currentImagePreview) {
							localStorage.setItem("dashboardImagePreview", currentImagePreview);
						}
						if (currentImageId) {
							localStorage.setItem("dashboardImageId", currentImageId.toString());
						}
					} catch (error) {
						console.error("Error saving recognition results:", error);
					}
				}
				break;

			case "error":
				setIsAnalyzing(false);
				showError(data.message || t("dashboard.analysisError"));
				break;
		}
	};

	// 处理图像识别结果
	const handleImageRecognitionResults = (
		imageId: number,
		results: any,
		imagePreview?: string
	) => {
		console.log("Dashboard - Image recognition results:", { imageId, results });

		// 设置当前图片ID
		setCurrentImageId(imageId);

		// 如果还没有预览图（备用处理）
		if (imagePreview && !currentImagePreview) {
			setCurrentImagePreview(imagePreview);
		}

		if (results && results.keywords && results.keywords.length > 0) {
			// 使用关键词创建简化的食物数据
			const recognizedFoods = results.keywords.map(
				(keyword: string, index: number) => ({
					id: index + 1,
					name: keyword,
					imageId,
					recognizedAt: new Date().toLocaleString("zh-CN"),
					calories_per_100g: 100, // 模拟数据
					isKeyword: true, // 标记这是关键词结果
				})
			);

			// 添加到识别历史
			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: results.keywords.join(", "),
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]); // 只保留最近5次

			// 显示成功消息
			showSuccess(
				`${t("dashboard.analysisComplete")}: ${recognizedFoods.length} ${t("dashboard.foodCount")}`
			);
		} else if (results && results.portions && results.portions.length > 0) {
			// 处理新的portions格式的识别结果
			const recognizedFoods = results.portions.map(
				(portion: any, index: number) => ({
					id: index + 1,
					name: portion.name,
					estimated_grams: portion.estimated_grams,
					cooking_method: portion.cooking_method,
					imageId,
					recognizedAt: new Date().toLocaleString("zh-CN"),
					isKeyword: false,
				})
			);

			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: recognizedFoods.map((food: any) => food.name).join(", "),
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]);

			showSuccess(t("imageUpload.analysisComplete"));
		} else if (results && results.results && results.results.length > 0) {
			// 处理完整的识别结果（向后兼容）
			const recognizedFoods = results.results.map((result: any) => ({
				...result.food,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
			}));

			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: recognizedFoods.map((food: any) => food.name).join(", "),
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]);

			showSuccess(t("imageUpload.analysisComplete"));
		} else {
			// 没有识别到食物
			showError(t("imageUpload.noFoodDetected"));
		}
	};

	// 清除当前图片预览和识别结果
	const clearCurrentImage = () => {
		if (currentImagePreview) {
			URL.revokeObjectURL(currentImagePreview);
			setCurrentImagePreview(null);
			setCurrentImageId(null);
			setEstimatedPortions([]);
			setDetectedFoods([]);
			setAnalysisProgress(0);
			setAnalysisStep("");

			// Clear localStorage
			try {
				localStorage.removeItem("dashboardEstimatedPortions");
				localStorage.removeItem("dashboardImagePreview");
				localStorage.removeItem("dashboardImageId");
			} catch (error) {
				console.error("Error clearing recognition results from storage:", error);
			}
		}
	};

	// 处理条形码检测结果
	const handleBarcodeDetected = (results: any) => {
		console.log("Barcode detection results:", results);
		setBarcodeResults(results);

		if (results.createdFoods && results.createdFoods.length > 0) {
			showSuccess(t("foodSearch.foodCreated"));
		}
	};

	// 处理将条形码食物添加到餐食
	const handleAddBarcodeFood = async (food: any) => {
		try {
			// 简单的食物添加逻辑 - 打开添加食物对话框或直接添加
			// 这里需要根据项目的具体流程来实现
			console.log("Adding barcode food to meal:", food);

			// 暂时显示成功信息，提示用户食物可用
			showSuccess(`${food.name} ${t("dashboard.addToMealSuccess")} ID:${food.id}`);

			// TODO: 实现具体的添加到餐食逻辑
			// 例如：打开添加食物模态框，预填食物信息
			// 或者：直接创建一个新的餐食并添加该食物
		} catch (err) {
			console.error("Error adding barcode food to meal:", err);
			showError(
				`${t("dashboard.addToMealError")}: ${err instanceof Error ? err.message : t("api.unknownError")}`
			);
		}
	};

	// 打开条形码扫描器
	const openBarcodeScanner = () => {
		setShowBarcodeScanner(true);
	};

	// 关闭条形码扫描器
	const closeBarcodeScanner = () => {
		setShowBarcodeScanner(false);
		setBarcodeResults(null);
	};

	// 将识别到的食物添加到食物篮
	const handleAddRecognizedFoodsToBasket = async () => {
		if (!isAuthenticated) {
			onLoginRequired();
			return;
		}

		if (estimatedPortions.length === 0) {
			showError(t("dashboard.noFoodsToAdd"));
			return;
		}

		// Get nutrition data from localStorage (saved during analysis)
		const savedNutritionData = (() => {
			try {
				const saved = localStorage.getItem("dashboardNutritionData");
				return saved ? JSON.parse(saved) : [];
			} catch (error) {
				console.warn("Failed to load nutrition data from storage:", error);
				return [];
			}
		})();

		// Convert recognized foods to Food format compatible with meal cart
		const recognizedFoods = estimatedPortions.map((portion, index) => {
			// Find matching nutrition data
			const nutritionData = savedNutritionData.find(
				(nutrition: any) => nutrition.food_name === portion.name
			);

			return {
				id: Date.now() + index, // Generate unique ID for recognized foods
				name: portion.name,
				// Use real USDA nutrition data if available, otherwise use defaults
				calories_per_100g: nutritionData?.calories_per_100g || 100,
				protein_per_100g: nutritionData?.protein_per_100g || 10,
				fat_per_100g: nutritionData?.fat_per_100g || 5,
				carbs_per_100g: nutritionData?.carbs_per_100g || 20,
				fiber_per_100g: nutritionData?.fiber_per_100g || 2,
				sugar_per_100g: nutritionData?.sugar_per_100g || 5,
				sodium_per_100g: nutritionData?.sodium_per_100g || 100,
				serving_size: portion.estimated_grams,
				serving_unit: "g",
				is_custom: false,
				is_usda: nutritionData?.fdc_id ? true : false,
				fdc_id: nutritionData?.fdc_id || null,
				description:
					nutritionData?.usda_description || portion.cooking_method || "",
				brand: "",
				barcode: "",
				image_url: "",
			};
		});

		try {
			// Create custom foods for each recognized food item
			const createdFoods = [];
			for (const portion of estimatedPortions) {
				// Find matching nutrition data
				const nutritionData = savedNutritionData.find(
					(nutrition: any) => nutrition.food_name === portion.name
				);

				const createFoodRequest = {
					name: portion.name,
					serving_size: portion.estimated_grams,
					calories_per_100g: nutritionData?.calories_per_100g || 100,
					protein_per_100g: nutritionData?.protein_per_100g || 10,
					fat_per_100g: nutritionData?.fat_per_100g || 5,
					carbs_per_100g: nutritionData?.carbs_per_100g || 20,
					fiber_per_100g: nutritionData?.fiber_per_100g || 2,
					sugar_per_100g: nutritionData?.sugar_per_100g || 5,
					sodium_per_100g: nutritionData?.sodium_per_100g || 100,
					usda_fdc_id: nutritionData?.fdc_id || null,
					description:
						nutritionData?.usda_description || portion.cooking_method || "",
				};

				try {
					const response = await foodService.createCustomFood(createFoodRequest);
					if (response.success) {
						createdFoods.push(response.data);
					}
				} catch (error) {
					console.warn(`Failed to create custom food "${portion.name}":`, error);
					// Continue with the loop even if one food creation fails
				}
			}

			// Create meal cart items with estimated quantities
			const mealCartItems = recognizedFoods.map(food => ({
				food: food,
				quantity: food.serving_size, // Use estimated grams as quantity
			}));

			// Save to localStorage for FoodSearch page to pick up
			localStorage.setItem("mealCart", JSON.stringify(mealCartItems));
			localStorage.setItem(
				"mealName",
				`${t("dashboard.recognizedMeal")} - ${new Date().toLocaleTimeString()}`
			);
			localStorage.setItem("mealTime", new Date().toISOString());

			const successMessage =
				createdFoods.length > 0
					? `${t("dashboard.addedToBasket")}: ${estimatedPortions.length} ${t("dashboard.foodItems")}. ${createdFoods.length} ${t("dashboard.foodsAddedToLibrary")}`
					: `${t("dashboard.addedToBasket")}: ${estimatedPortions.length} ${t("dashboard.foodItems")}`;

			showSuccess(successMessage);

			// Navigate to FoodSearch page where user can review and save the meal
			navigate("/");
		} catch (error) {
			console.error("Error creating custom foods:", error);
			showError(t("dashboard.errorCreatingFoods"));
		}
	};

	// 模拟数据
	const recentMeals = [
		{
			id: 1,
			type: t("meal.breakfast"),
			time: "08:30",
			items: ["Oatmeal", "Banana", "Milk"],
			calories: 320,
		},
		{
			id: 2,
			type: t("meal.lunch"),
			time: "12:45",
			items: ["Chicken Salad", "Whole Wheat Bread"],
			calories: 480,
		},
		{
			id: 3,
			type: t("meal.dinner"),
			time: "18:20",
			items: ["Steamed Egg", "Vegetables", "Rice"],
			calories: 650,
		},
	];

	if (!isAuthenticated) {
		return (
			<div className="dashboard">
				<div className="not-authenticated">
					<h2>{t("dashboard.title")}</h2>
					<p>{t("auth.loginToAccess")}</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						{t("auth.login")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<h1>{t("dashboard.todayMeals")}</h1>
				<p className="date">{todayDate}</p>
			</div>
			<div className="dashboard-grid">
				{/* 图像识别 */}
				<div className="card image-recognition-card">
					<div className="card-header">
						<h3 className="card-title">📸 {t("dashboard.uploadImage")}</h3>
						<button
							className="btn btn-info"
							onClick={openBarcodeScanner}
							disabled={!isAuthenticated}
						>
							📊 {t("dashboard.scanBarcodeMode")}
						</button>
					</div>
					<div className="image-recognition-content">
						<div className="upload-section">
							{currentImagePreview ? (
								<div className="image-preview-container">
									<img
										src={currentImagePreview}
										alt={t("dashboard.uploadImage")}
										className="uploaded-image-preview"
									/>
									<div className="image-overlay">
										<ImageUpload
											onImageUploaded={handleImageRecognitionResults}
											onImagePreview={handleImagePreview}
											onStreamingProgress={handleStreamingProgress}
											disabled={!isAuthenticated}
											useStreaming={true}
										/>
										<button
											className="btn btn-secondary clear-btn"
											onClick={clearCurrentImage}
											title={t("common.clear")}
										>
											✕
										</button>
									</div>
								</div>
							) : (
								<>
									<p className="upload-description">{t("dashboard.uploadImage")}</p>
									<ImageUpload
										onImageUploaded={handleImageRecognitionResults}
										onImagePreview={handleImagePreview}
										onStreamingProgress={handleStreamingProgress}
										disabled={!isAuthenticated}
										useStreaming={true}
									/>
								</>
							)}
						</div>

						{/* 流式分析进度显示 */}
						{isAnalyzing && (
							<div className="analysis-progress">
								<div className="progress-header">
									<h4>
										{t("common.loading")}:
										{analysisStep === "food_detection"
											? t("dashboard.detectingFood")
											: analysisStep === "portion_estimation"
												? t("dashboard.estimatingPortion")
												: t("common.loading")}
									</h4>
									<div className="progress-percentage">{analysisProgress}%</div>
								</div>
								<div className="progress-bar">
									<div
										className="progress-fill"
										style={{ width: `${analysisProgress}%` }}
									></div>
								</div>

								{/* 显示已检测到的食物 */}
								{detectedFoods.length > 0 && (
									<div className="detected-foods">
										<h5>{t("imageUpload.identifiedFoods")}:</h5>
										<div className="foods-list">
											{detectedFoods.map((food, index) => (
												<span key={index} className="food-item">
													{food.name}
													{food.confidence && (
														<span className="confidence">
															({Math.round(food.confidence * 100)}%)
														</span>
													)}
												</span>
											))}
										</div>
									</div>
								)}

								{estimatedPortions.length > 0 && (
									<div className="estimated-portions">
										<h5>{t("imageUpload.estimatedPortion")}:</h5>
										<div className="portions-list">
											{estimatedPortions.map((portion, index) => (
												<div key={index} className="portion-item">
													<span className="food-name">{portion.name}:</span>
													<span className="portion-amount">{portion.estimated_grams}g</span>
													{portion.cooking_method && (
														<span className="portion-desc">({portion.cooking_method})</span>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{estimatedPortions.length > 0 && (
							<div className="recognition-results">
								<h4>{t("imageUpload.identifiedFoods")}:</h4>
								<div className="estimated-portions-final">
									{estimatedPortions.map((portion, index) => (
										<div key={index} className="recognized-food-item">
											<div className="food-name">{portion.name}</div>
											<div className="food-info">
												<div className="food-details">
													<div className="weight-recommendation">
														<span className="weight-label">{t("dashboard.portion")}:</span>
														<span className="weight-amount">{portion.estimated_grams}g</span>
														{portion.cooking_method && (
															<span className="cooking-method">
																({portion.cooking_method})
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Add to Basket Button */}
								<div className="add-to-basket-section">
									<div className="basket-buttons">
										<button
											className="btn btn-success add-basket-btn"
											onClick={handleAddRecognizedFoodsToBasket}
											disabled={!isAuthenticated}
										>
											🛒 {t("dashboard.addAllToBasket")}
										</button>
										<button
											className="btn btn-secondary clear-results-btn"
											onClick={clearCurrentImage}
											title={t("dashboard.clearRecognitionResults")}
										>
											🗑️ {t("common.clear")}
										</button>
									</div>
									<p className="basket-hint">{t("dashboard.addToBasketHint")}</p>
								</div>
							</div>
						)}

						{imageRecognitionHistory.length > 0 && (
							<div className="recognition-history">
								<h4>{t("dashboard.recentActivity")}:</h4>
								<div className="history-list">
									{imageRecognitionHistory.map((item, index) => (
										<div key={index} className="history-item">
											<div className="history-time">{item.recognizedAt}</div>
											<div className="history-foods">
												{t("dashboard.analysisComplete")}: {item.foodCount}{" "}
												{t("dashboard.foodCount")}: {item.foods}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* 今日餐食 */}
				<div className="card meals-card">
					<div className="card-header">
						<h3 className="card-title">{t("dashboard.todayMeals")}</h3>
						<button
							className="btn btn-primary"
							onClick={() =>
								isAuthenticated ? console.log("Add meal") : onLoginRequired()
							}
						>
							+ {t("dashboard.addMeal")}
						</button>
					</div>
					<div className="meals-list">
						{recentMeals.map(meal => (
							<div key={meal.id} className="meal-item">
								<div className="meal-info">
									<div className="meal-type">{meal.type}</div>
									<div className="meal-time">{meal.time}</div>
									<div className="meal-foods">{meal.items.join(", ")}</div>
								</div>
								<div className="meal-calories">
									<span className="calories-value">{meal.calories}</span>
									<span className="calories-unit">kcal</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* 条形码识别结果 */}
				{barcodeResults && (
					<div className="card barcode-results-card">
						<div className="card-header">
							<h3 className="card-title">📊 {t("barcode.scanBarcode")}</h3>
							<button
								className="btn btn-secondary"
								onClick={() => setBarcodeResults(null)}
							>
								{t("common.clear")}
							</button>
						</div>
						<div className="barcode-results-content">
							{/* 检测到的条形码 */}
							<div className="detected-barcodes">
								<h4>{t("barcode.scanBarcode")}</h4>
								<div className="barcodes-list">
									{barcodeResults.barcodes?.map((barcode: any, index: number) => (
										<div key={index} className="barcode-item">
											<div className="barcode-data">
												<span className="barcode-number">{barcode.formatted_data}</span>
												<span className="barcode-type">{barcode.type}</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* 创建的食品信息 */}
							{barcodeResults.createdFoods?.length > 0 && (
								<div className="created-foods">
									<h4>
										{t("imageUpload.identifiedFoods")} (
										{barcodeResults.createdFoods.length})
									</h4>
									<div className="foods-list">
										{barcodeResults.createdFoods.map((food: any, index: number) => (
											<div key={index} className="created-food-item">
												<div className="food-header">
													<h5>{food.name}</h5>
													{food.brand && <span className="food-brand">{food.brand}</span>}
													{food.nutrition_grade && (
														<span
															className={`nutrition-grade grade-${food.nutrition_grade.toLowerCase()}`}
														>
															{food.nutrition_grade.toUpperCase()}
														</span>
													)}
												</div>

												{food.image_url && (
													<img src={food.image_url} alt={food.name} className="food-image" />
												)}

												<div className="nutrition-summary">
													<div className="nutrition-grid">
														<div className="nutrition-item">
															<span className="label">{t("common.calories")}</span>
															<span className="value">{food.calories_per_100g} kcal/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">{t("common.protein")}</span>
															<span className="value">{food.protein_per_100g}g/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">{t("common.fat")}</span>
															<span className="value">{food.fat_per_100g}g/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">{t("common.carbs")}</span>
															<span className="value">{food.carbs_per_100g}g/100g</span>
														</div>
													</div>
												</div>

												<div className="food-meta">
													<p>
														<strong>{t("barcode.scanBarcode")}:</strong> {food.barcode}
													</p>
													<p>
														<strong>{t("common.source", "Source")}:</strong>{" "}
														{food.data_source}
													</p>
													<p>
														<strong>Food ID:</strong> {food.id}
													</p>
												</div>

												<div className="food-actions">
													<button
														className="btn btn-primary add-to-meal-btn"
														onClick={() => handleAddBarcodeFood(food)}
													>
														📝 {t("foodSearch.addToMeal")}
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{barcodeResults.createdFoods?.length === 0 && (
								<div className="no-food-results">
									<p>{t("barcode.productNotFound")}</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
			<style>{`
				.dashboard {
					max-width: 1200px;
					margin: 0 auto;
				}

				.dashboard-header {
					margin-bottom: 2rem;
				}

				.dashboard-header h1 {
					margin: 0;
					color: #2c3e50;
					font-size: 2rem;
				}

				.date {
					color: #7f8c8d;
					margin: 0.5rem 0 0 0;
				}

				.dashboard-grid {
					display: grid;
					grid-template-columns: 1fr;
					gap: 1.5rem;
				}

				.meals-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.meal-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem;
					background: #f8f9fa;
					border-radius: 6px;
				}

				.meal-type {
					font-weight: bold;
					color: #2c3e50;
				}

				.meal-time {
					font-size: 0.9rem;
					color: #7f8c8d;
					margin: 0.25rem 0;
				}

				.meal-foods {
					font-size: 0.9rem;
					color: #5a6c7d;
				}

				.meal-calories {
					text-align: right;
				}

				.calories-value {
					font-size: 1.1rem;
					font-weight: bold;
					color: var(--primary-color);
				}

				.calories-unit {
					font-size: 0.8rem;
					color: #7f8c8d;
				}

				.not-authenticated {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					margin: 2rem auto;
					max-width: 600px;
				}

				.not-authenticated h2 {
					margin-bottom: 1rem;
					color: #2c3e50;
				}

				.not-authenticated p {
					margin-bottom: 2rem;
					color: #7f8c8d;
				}

				/* 图像识别样式 */
				.image-recognition-card {
					margin-bottom: 1.5rem;
				}

				.image-recognition-content {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				.upload-section {
					text-align: center;
					padding: 1rem;
					border: 2px dashed #e9ecef;
					border-radius: 8px;
					background: #f8f9fa;
					position: relative;
					min-height: 200px;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}

				.upload-description {
					margin-bottom: 1rem;
					color: #6c757d;
					font-size: 0.9rem;
				}

				.image-preview-container {
					position: relative;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
				}

				.uploaded-image-preview {
					max-width: 100%;
					max-height: 300px;
					border-radius: 8px;
					box-shadow: var(--shadow-light);
					object-fit: contain;
				}

				.image-overlay {
					position: absolute;
					bottom: 10px;
					right: 10px;
					background: var(--text-white-overlay);
					border-radius: 8px;
					padding: 0.5rem;
					box-shadow: var(--shadow-notification);
					display: flex;
					gap: 0.5rem;
					align-items: center;
				}

				.image-overlay .btn {
					background: #007bff;
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 6px;
					font-size: 0.85rem;
					cursor: pointer;
					transition: all 0.3s ease;
				}

				.image-overlay .btn:hover:not(:disabled) {
					background: #0056b3;
					transform: translateY(-1px);
				}

				.clear-btn {
					background: #6c757d !important;
					color: white;
					padding: 0.3rem 0.6rem !important;
					font-size: 0.8rem !important;
					min-width: auto;
					line-height: 1;
				}

				.clear-btn:hover:not(:disabled) {
					background: #5a6268 !important;
				}

				.recognition-results {
					padding: 1rem;
					background: #e8f5e8;
					border-radius: 8px;
					border-left: 4px solid var(--success-alt);
				}

				.recognition-results h4 {
					margin: 0 0 0.75rem 0;
					color: #155724;
					font-size: 1rem;
				}

				.recognized-foods {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 0.75rem;
				}

				.recognized-food-item {
					padding: 0.75rem;
					background: white;
					border-radius: 6px;
					border: 1px solid #c3e6cb;
				}

				.food-name {
					font-weight: bold;
					color: #155724;
					margin-bottom: 0.25rem;
				}

				.food-info {
					font-size: 0.85rem;
					color: #6c757d;
				}

				.food-details {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.weight-recommendation {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					flex-wrap: wrap;
				}

				.weight-label {
					font-size: 0.8rem;
					color: #495057;
					font-weight: 500;
				}

				.weight-amount {
					background: var(--success-alt);
					color: white;
					padding: 0.2rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.cooking-method {
					font-size: 0.75rem;
					color: #6c757d;
					font-style: italic;
					background: #f8f9fa;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
				}

				.confidence-score {
					display: flex;
					align-items: center;
					gap: 0.3rem;
				}

				.confidence-label {
					font-size: 0.75rem;
					color: #6c757d;
				}

				.confidence-value {
					background: #17a2b8;
					color: white;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
					font-size: 0.75rem;
					font-weight: 500;
				}

				.calories {
					background: #d4edda;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-size: 0.8rem;
					align-self: flex-start;
				}

				.estimated-calories {
					display: flex;
					align-items: center;
					gap: 0.3rem;
				}

				.calories-label {
					font-size: 0.75rem;
					color: #6c757d;
				}

				.calories-value {
					background: #fd7e14;
					color: white;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
					font-size: 0.75rem;
					font-weight: 500;
				}

				.keyword-hint {
					margin-bottom: 0.75rem;
					padding: 0.5rem;
					background: #fff3cd;
					border: 1px solid #ffeaa7;
					border-radius: 4px;
					font-size: 0.85rem;
					color: #856404;
				}

				.keyword-item {
					background: #f8f9ff;
					border: 1px solid #c3d4f7;
				}

				.keyword-label {
					background: #e3f2fd;
					color: #1976d2;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: 500;
				}

				.recognition-history {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #6c757d;
				}

				.recognition-history h4 {
					margin: 0 0 0.75rem 0;
					color: #495057;
					font-size: 1rem;
				}

				.history-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.history-item {
					padding: 0.5rem;
					background: white;
					border-radius: 4px;
					border: 1px solid #dee2e6;
				}

				.history-time {
					font-size: 0.8rem;
					color: #6c757d;
					margin-bottom: 0.25rem;
				}

				.history-foods {
					font-size: 0.85rem;
					color: #495057;
				}

				/* 流式分析进度样式 */
				.analysis-progress {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #007bff;
					margin-bottom: 1rem;
				}

				.progress-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.progress-header h4 {
					margin: 0;
					color: #495057;
					font-size: 1rem;
				}

				.progress-percentage {
					font-weight: bold;
					color: #007bff;
				}

				.progress-bar {
					width: 100%;
					height: 8px;
					background: #e9ecef;
					border-radius: 4px;
					overflow: hidden;
					margin-bottom: 1rem;
				}

				.progress-fill {
					height: 100%;
					background: linear-gradient(90deg, #007bff, #0056b3);
					transition: width 0.3s ease;
				}

				.detected-foods, .estimated-portions {
					margin-top: 1rem;
					padding-top: 1rem;
					border-top: 1px solid #dee2e6;
				}

				.detected-foods h5, .estimated-portions h5 {
					margin: 0 0 0.5rem 0;
					color: #343a40;
					font-size: 0.9rem;
				}

				.foods-list {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
				}

				.food-item {
					background: #e3f2fd;
					color: #1976d2;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					border: 1px solid #bbdefb;
				}

				.confidence {
					opacity: 0.7;
					font-size: 0.7rem;
				}

				.portions-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.portion-item {
					display: flex;
					gap: 0.5rem;
					align-items: center;
					padding: 0.5rem;
					background: #fff3e0;
					border: 1px solid #ffcc02;
					border-radius: 4px;
					font-size: 0.85rem;
				}

				.food-name {
					font-weight: bold;
					color: #e65100;
				}

				.portion-amount {
					background: #ff9800;
					color: white;
					padding: 0.2rem 0.4rem;
					border-radius: 3px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.portion-desc {
					color: #757575;
					font-style: italic;
				}

				/* 条形码识别结果样式 */
				.barcode-results-card {
					margin-top: 1.5rem;
				}

				.barcode-results-content {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				.detected-barcodes, .usda-products {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #17a2b8;
				}

				.detected-barcodes h4, .usda-products h4 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 1rem;
				}

				.barcodes-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.barcode-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 6px;
					padding: 0.75rem;
				}

				.barcode-data {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.barcode-number {
					font-family: 'Courier New', monospace;
					font-size: 1.1rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.barcode-type {
					background: var(--success-alt);
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.products-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.usda-product-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
				}

				.usda-product-item h5 {
					margin: 0 0 0.75rem 0;
					color: #2c3e50;
					font-size: 1rem;
					line-height: 1.4;
				}

				.product-details {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.product-details p {
					margin: 0;
					font-size: 0.9rem;
					color: #6c757d;
				}

				.no-usda-results {
					padding: 1rem;
					background: #fff3cd;
					border: 1px solid #ffeaa7;
					border-radius: 8px;
					text-align: center;
				}

				.no-usda-results p {
					margin: 0;
					color: #856404;
					font-style: italic;
				}

				/* Open Food Facts产品样式 */
				.openfoodfacts-products {
					padding: 1rem;
					background: #f0f8ff;
					border-radius: 8px;
					border-left: 4px solid #007bff;
					margin-top: 1rem;
				}

				.openfoodfacts-products h4 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 1rem;
				}

				.openfoodfacts-product-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
					margin-bottom: 1rem;
				}

				.product-header {
					display: flex;
					gap: 1rem;
					margin-bottom: 1rem;
					align-items: flex-start;
				}

				.product-image {
					width: 80px;
					height: 80px;
					object-fit: cover;
					border-radius: 6px;
					border: 1px solid #dee2e6;
				}

				.product-title {
					flex: 1;
				}

				.product-title h5 {
					margin: 0 0 0.5rem 0;
					color: #2c3e50;
					font-size: 1rem;
					line-height: 1.3;
				}

				.product-brand {
					margin: 0;
					color: #6c757d;
					font-size: 0.9rem;
					font-style: italic;
				}

				.nutrition-grade {
					display: inline-block;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-weight: bold;
					margin-left: 0.5rem;
				}

				.nutrition-grade.grade-a {
					background: var(--success-alt);
					color: white;
				}

				.nutrition-grade.grade-b {
					background: #ffc107;
					color: #212529;
				}

				.nutrition-grade.grade-c {
					background: #fd7e14;
					color: white;
				}

				.nutrition-grade.grade-d {
					background: #dc3545;
					color: white;
				}

				.nutrition-grade.grade-e {
					background: #6f42c1;
					color: white;
				}

				.nutrition-facts {
					margin-top: 1rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 6px;
				}

				.nutrition-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
					gap: 0.5rem;
					margin-top: 0.5rem;
				}

				.nutrition-item {
					display: flex;
					justify-content: space-between;
					padding: 0.25rem 0.5rem;
					background: white;
					border-radius: 4px;
					font-size: 0.85rem;
				}

				.nutrition-item span:first-child {
					color: #495057;
				}

				.nutrition-item span:last-child {
					font-weight: bold;
					color: #2c3e50;
				}

				@media (max-width: 768px) {
					.recognized-foods {
						grid-template-columns: 1fr;
					}
					
					.upload-section {
						padding: 0.75rem;
						min-height: 150px;
					}

					.uploaded-image-preview {
						max-height: 200px;
					}

					.image-overlay {
						bottom: 5px;
						right: 5px;
						padding: 0.25rem;
					}

					.image-overlay .btn {
						padding: 0.4rem 0.8rem;
						font-size: 0.8rem;
					}

					.barcode-data {
						flex-direction: column;
						gap: 0.5rem;
						align-items: flex-start;
					}

					.add-to-meal-btn {
						font-size: 0.8rem;
						padding: 0.4rem 0.8rem;
					}
				}

				.food-actions {
					margin-top: 1rem;
					padding-top: 1rem;
					border-top: 1px solid #e9ecef;
					display: flex;
					justify-content: center;
				}

				.add-to-meal-btn {
					background: var(--success-alt);
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 6px;
					font-size: 0.9rem;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.add-to-meal-btn:hover {
					background: #218838;
					transform: translateY(-1px);
					box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
				}

				.add-to-meal-btn:active {
					transform: translateY(0);
				}

				/* Add to Basket Button Styles */
				.add-to-basket-section {
					margin-top: 1.5rem;
					padding-top: 1rem;
					border-top: 1px solid #e9ecef;
					text-align: center;
				}

				.add-basket-btn {
					background: #28a745;
					color: white;
					border: none;
					padding: 0.75rem 1.5rem;
					border-radius: 6px;
					font-size: 1rem;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
					min-width: 180px;
					justify-content: center;
				}

				.add-basket-btn:hover {
					background: #218838;
					transform: translateY(-1px);
					box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
				}

				.add-basket-btn:active {
					transform: translateY(0);
				}

				.add-basket-btn:disabled {
					background: #6c757d;
					cursor: not-allowed;
					transform: none;
					box-shadow: none;
				}

				.basket-hint {
					margin: 0.5rem 0 0 0;
					color: #6c757d;
					font-size: 0.85rem;
					line-height: 1.4;
				}

				.basket-buttons {
					display: flex;
					gap: 0.75rem;
					justify-content: center;
					align-items: center;
					flex-wrap: wrap;
				}

				.clear-results-btn {
					background: #6c757d;
					color: white;
					border: none;
					padding: 0.75rem 1.25rem;
					border-radius: 6px;
					font-size: 0.95rem;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
				}

				.clear-results-btn:hover {
					background: #5a6268;
					transform: translateY(-1px);
					box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3);
				}

				.clear-results-btn:active {
					transform: translateY(0);
				}
			`}</style>

			{/* 条形码扫描器模态框 */}
			<BarcodeScanner
				isOpen={showBarcodeScanner}
				onClose={closeBarcodeScanner}
				onBarcodeDetected={handleBarcodeDetected}
			/>
		</div>
	);
};
export default Dashboard;
