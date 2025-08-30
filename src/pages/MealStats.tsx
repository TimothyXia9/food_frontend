import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { mealService } from "../services/mealService";
import { DateRangePicker } from "../components/DateRangePicker";
import {
	getCurrentLocalDate,
	formatUTCDateToLocal,
	formatUTCTimeToLocal,
} from "../utils/timezone";

interface MealStatsProps {
	onLoginRequired: () => void;
}

const MealStats = ({ onLoginRequired }: MealStatsProps) => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const { showError, showConfirm } = useNotification();

	const [selectedDate, setSelectedDate] = React.useState(() => {
		return getCurrentLocalDate();
	});
	const [startDate, setStartDate] = React.useState(() => {
		return getCurrentLocalDate();
	});
	const [endDate, setEndDate] = React.useState(() => {
		return getCurrentLocalDate();
	});
	const [isSingleMode, setIsSingleMode] = React.useState(true);
	const [mealStatistics, setMealStatistics] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);
	const [recentMeals, setRecentMeals] = React.useState<any[]>([]);
	const [currentMeals, setCurrentMeals] = React.useState<any[]>([]);
	const [loadingMeals, setLoadingMeals] = React.useState(false);

	const loadMealStatistics = React.useCallback(async () => {
		if (!isAuthenticated) return;

		setLoading(true);
		try {
			if (!isSingleMode) {
				// Load statistics for date range
				const response = await mealService.getNutritionStats(startDate, endDate);
				if (response.success) {
					setMealStatistics(response.data);
				} else {
					showError(response.error?.message || t("mealStats.errorLoadingStats"));
				}
			} else {
				// Load statistics for single date
				const response = await mealService.getMealStatistics(selectedDate);
				if (response.success) {
					setMealStatistics(response.data);
				} else {
					showError(response.error?.message || t("mealStats.errorLoadingMeals"));
				}
			}
		} catch (error) {
			console.error("Load meal statistics error:", error);
			// 检查是否是认证错误，认证错误由API客户端统一处理，不显示重复通知
			if (
				error instanceof Error &&
				!error.message.includes("Authentication failed")
			) {
				showError(t("mealStats.errorGettingStats"));
			}
		} finally {
			setLoading(false);
		}
	}, [
		isAuthenticated,
		isSingleMode,
		startDate,
		endDate,
		selectedDate,
		showError,
	]);

	const loadCurrentMeals = React.useCallback(async () => {
		if (!isAuthenticated) return;

		setLoadingMeals(true);
		try {
			if (isSingleMode) {
				// 单日模式：显示选定日期的所有食物篮
				const response = await mealService.getUserMeals({
					date: selectedDate,
					page_size: 100,
				});
				if (response.success && response.data) {
					setCurrentMeals(response.data.meals || []);
				}
			} else {
				// 多日模式：显示时间段内所有食物篮
				const response = await mealService.getUserMeals({
					start_date: startDate,
					end_date: endDate,
					page_size: 100,
				});
				if (response.success && response.data) {
					setCurrentMeals(response.data.meals || []);
				}
			}
		} catch (error) {
			console.error("Load current meals error:", error);
			// 认证错误由API客户端统一处理，不显示重复通知
			if (
				error instanceof Error &&
				!error.message.includes("Authentication failed")
			) {
				// 可以在这里添加其他类型的错误提示，但通常meals加载失败是静默的
			}
		} finally {
			setLoadingMeals(false);
		}
	}, [isAuthenticated, isSingleMode, selectedDate, startDate, endDate]);

	const loadRecentMeals = async () => {
		if (!isAuthenticated) return;

		try {
			const response = await mealService.getRecentMeals(7);
			if (response.success && response.data) {
				setRecentMeals(response.data.meals || []);
			}
		} catch (error) {
			console.error("Load recent meals error:", error);
			// 认证错误由API客户端统一处理，不显示重复通知
		}
	};

	// Initial data loading effect
	React.useEffect(() => {
		if (!isAuthenticated) {
			onLoginRequired();
		}
	}, [isAuthenticated, onLoginRequired]);

	React.useEffect(() => {
		if (isAuthenticated) {
			// 使用一个统一的加载函数，避免多个并发API调用产生重复错误
			const loadAllData = async () => {
				try {
					await Promise.allSettled([
						loadMealStatistics(),
						loadRecentMeals(),
						loadCurrentMeals(),
					]);
				} catch (error) {
					// 这里的错误已经在各个函数内部处理，不需要额外处理
				}
			};
			loadAllData();
		}
	}, [isAuthenticated, loadMealStatistics, loadCurrentMeals]);

	// 监听日期变化，自动加载对应日期的数据
	React.useEffect(() => {
		if (isAuthenticated) {
			const loadDateData = async () => {
				try {
					await Promise.allSettled([loadMealStatistics(), loadCurrentMeals()]);
				} catch (error) {
					// 这里的错误已经在各个函数内部处理，不需要额外处理
				}
			};
			loadDateData();
		}
	}, [isAuthenticated, loadMealStatistics, loadCurrentMeals]);

	const loadAllMeals = async () => {
		if (!isAuthenticated) return;

		setLoadingMeals(true);
		try {
			// 显示所有：不传递任何日期参数
			const response = await mealService.getUserMeals({
				page_size: 100,
			});
			if (response.success && response.data) {
				setCurrentMeals(response.data.meals || []);
			}
		} catch (error) {
			console.error("Load all meals error:", error);
		} finally {
			setLoadingMeals(false);
		}
	};

	const handleEditMeal = async (mealId: number) => {
		try {
			// Load meal details before navigation
			const response = await mealService.getMealDetails(mealId);
			if (response.success && response.data) {
				const mealData = response.data as any; // Backend returns full meal data including date

				// Store meal data in sessionStorage for the food search page
				sessionStorage.setItem(
					"editingMeal",
					JSON.stringify({
						id: mealData.id,
						name: mealData.name,
						date: mealData.date,
						meal_type: mealData.meal_type,
						foods: mealData.foods || [],
						total_calories: mealData.total_calories,
						notes: mealData.notes,
					})
				);

				// Navigate to food search page with meal editing context
				navigate(`/?edit_meal=${mealId}`);
			} else {
				showError(response.error?.message || t("mealStats.errorGettingDetails"));
			}
		} catch (error) {
			console.error("Load meal details error:", error);
			showError(t("mealStats.errorGettingDetailsGeneric"));
		}
	};

	const handleDateRangeApply = () => {
		// 数据加载现在由useEffect自动处理，这里保留回调用于其他用途
		if (isAuthenticated) {
			// 可选：添加手动刷新逻辑
			loadMealStatistics();
			loadCurrentMeals();
		}
	};

	const handleShowAll = () => {
		if (isAuthenticated) {
			loadAllMeals();
		}
	};

	const handleDeleteMeal = async (mealId: number) => {
		const confirmed = await showConfirm(t("mealStats.deleteMealConfirm"));
		if (!confirmed) return;

		try {
			const response = await mealService.deleteMeal(mealId);
			if (response.success) {
				await loadCurrentMeals();
				await loadMealStatistics();
			} else {
				showError(response.error?.message || t("mealStats.deleteMealFailed"));
			}
		} catch (error) {
			console.error("Delete meal error:", error);
			showError(t("mealStats.deleteMealError"));
		}
	};

	const formatDate = (dateString: string) => {
		// 直接使用日期字符串，避免时区转换问题
		const [year, month, day] = dateString.split("-");
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		};
		// 使用当前语言设置进行本地化
		const locale = i18n.language === "zh" ? "zh-CN" : "en-US";
		return date.toLocaleDateString(locale, options);
	};

	const getMealTypeDisplayName = (mealType: string) => {
		const names: Record<string, string> = {
			breakfast: t("mealStats.mealTypes.breakfast"),
			lunch: t("mealStats.mealTypes.lunch"),
			dinner: t("mealStats.mealTypes.dinner"),
			snack: t("mealStats.mealTypes.snack"),
		};
		return names[mealType] || mealType;
	};

	if (!isAuthenticated) {
		return (
			<div className="meal-stats-login-required">
				<div className="login-prompt">
					<h2>{t("mealStats.title")}</h2>
					<p>{t("mealStats.loginPrompt")}</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						{t("mealStats.loginToView")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="meal-stats">
			<div className="stats-controls">
				<div className="date-controls-wrapper">
					<DateRangePicker
						startDate={isSingleMode ? selectedDate : startDate}
						endDate={isSingleMode ? selectedDate : endDate}
						onStartDateChange={date => {
							if (isSingleMode) {
								setSelectedDate(date);
							} else {
								setStartDate(date);
							}
						}}
						onEndDateChange={date => {
							if (isSingleMode) {
								setSelectedDate(date);
							} else {
								setEndDate(date);
							}
						}}
						isSingleMode={isSingleMode}
						onModeChange={setIsSingleMode}
						onApply={handleDateRangeApply}
					/>
					<button type="button" className="show-all-btn" onClick={handleShowAll}>
						{t("mealStats.showAll")}
					</button>
				</div>
			</div>

			{loading ? (
				<div className="loading">
					<div className="loading-spinner">📊</div>
					<p>{t("mealStats.loadingStatsData")}</p>
				</div>
			) : (
				<div className="stats-content">
					<div className="stats-main-layout">
						{/* Left Column - Food Basket */}
						<div className="food-basket-column">
							<div className="food-basket-header">
								<h3>{t("mealStats.myMealBaskets")}</h3>
								<button className="add-meal-btn" onClick={() => navigate("/")}>
									{t("mealStats.addMeal")}
								</button>
							</div>

							<div className="meal-basket-content">
								{loadingMeals ? (
									<div className="loading-meals">
										<div className="loading-spinner">🍽️</div>
										<p>{t("mealStats.loadingMealsData")}</p>
									</div>
								) : (
									<div className="meal-basket">
										{currentMeals.length > 0 ? (
											currentMeals.map((meal: any) => (
												<div key={meal.id} className="meal-basket-item">
													<div className="meal-info">
														<div className="meal-header">
															<span className="meal-type">
																{getMealTypeDisplayName(meal.meal_type)}
															</span>
															<span className="meal-time">
																{formatUTCTimeToLocal(meal.created_at)}
															</span>
														</div>
														<div className="meal-name">
															{meal.name || t("mealStats.unnamedMeal")}
														</div>
														<div className="meal-datetime">
															<span className="meal-date">
																📅 {formatUTCDateToLocal(meal.date)}
															</span>
															<span className="meal-created-time">
																🕐 {formatUTCTimeToLocal(meal.created_at)}
															</span>
														</div>
														<div className="meal-calories">
															{meal.total_calories.toFixed(1)} kcal
														</div>
														<div className="meal-macros">
															{t("mealStats.protein")}: {meal.total_protein.toFixed(1)}g |{" "}
															{t("mealStats.fat")}: {meal.total_fat.toFixed(1)}g |
															{t("mealStats.carbs")}: {meal.total_carbs.toFixed(1)}g
														</div>
														{meal.foods && meal.foods.length > 0 && (
															<div className="meal-foods">
																<div className="foods-header">
																	{t("mealStats.containsFoods")}
																</div>
																<div className="foods-list">
																	{meal.foods.slice(0, 3).map((mealFood: any, index: number) => (
																		<div key={index} className="food-item">
																			<span className="food-name">
																				{mealFood.food?.name || mealFood.name || "未知食物"}
																			</span>
																			<span className="food-quantity">
																				{Math.round(mealFood.quantity)}g
																			</span>
																		</div>
																	))}
																	{meal.foods.length > 3 && (
																		<div className="more-foods">
																			还有 {meal.foods.length - 3} 种食物...
																		</div>
																	)}
																</div>
															</div>
														)}
													</div>
													<div className="meal-actions">
														<button
															className="edit-btn"
															onClick={() => handleEditMeal(meal.id)}
															title="编辑餐食"
														>
															✏️
														</button>
														<button
															className="delete-btn"
															onClick={() => handleDeleteMeal(meal.id)}
															title="删除餐食"
														>
															🗑️
														</button>
													</div>
												</div>
											))
										) : (
											<div className="empty-basket">
												<div className="empty-icon">🍽️</div>
												<p>{t("mealStats.noMealsForDate")}</p>
												<button
													className="add-first-meal-btn"
													onClick={() => navigate("/")}
												>
													{t("mealStats.addFirstMeal")}
												</button>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Right Column - Statistics */}
						<div className="statistics-column">
							{mealStatistics ? (
								<>
									<div className="stats-overview">
										<h3>
											📅{" "}
											{!isSingleMode
												? `${startDate}${t("mealStats.dateRangeSeparator")}${endDate}`
												: formatDate(selectedDate)}{" "}
											{t("mealStats.statsOverview")}
										</h3>
										<div className="overview-grid">
											<div className="overview-item">
												<div className="overview-icon">🍽️</div>
												<div className="overview-data">
													<span className="overview-number">
														{!isSingleMode
															? mealStatistics.stats?.date_range?.days_count || 0
															: mealStatistics.summary?.total_meals || 0}
													</span>
													<span className="overview-label">
														{!isSingleMode ? "天数" : "餐次"}
													</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🔥</div>
												<div className="overview-data">
													<span className="overview-number">
														{!isSingleMode
															? mealStatistics.stats?.totals?.calories || 0
															: mealStatistics.summary?.total_calories || 0}
													</span>
													<span className="overview-label">卡路里</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🥩</div>
												<div className="overview-data">
													<span className="overview-number">
														{!isSingleMode
															? mealStatistics.stats?.totals?.protein || 0
															: mealStatistics.summary?.total_protein || 0}
														g
													</span>
													<span className="overview-label">蛋白质</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🥑</div>
												<div className="overview-data">
													<span className="overview-number">
														{!isSingleMode
															? mealStatistics.stats?.totals?.fat || 0
															: mealStatistics.summary?.total_fat || 0}
														g
													</span>
													<span className="overview-label">脂肪</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🍞</div>
												<div className="overview-data">
													<span className="overview-number">
														{!isSingleMode
															? mealStatistics.stats?.totals?.carbs || 0
															: mealStatistics.summary?.total_carbs || 0}
														g
													</span>
													<span className="overview-label">碳水化合物</span>
												</div>
											</div>
										</div>
									</div>

									{isSingleMode &&
										mealStatistics.meal_breakdown &&
										Object.keys(mealStatistics.meal_breakdown).length > 0 && (
											<div className="meal-breakdown">
												<h3>{t("mealStats.mealNutritionDistribution")}</h3>
												<div className="breakdown-grid">
													{Object.entries(mealStatistics.meal_breakdown).map(
														([mealType, data]: [string, any]) => (
															<div key={mealType} className="breakdown-item">
																<div className="breakdown-header">
																	<h4>{getMealTypeDisplayName(mealType)}</h4>
																	<span className="meal-count">{data.count} 餐</span>
																</div>
																<div className="breakdown-nutrition">
																	<div className="nutrition-item">
																		<span className="nutrition-label">卡路里:</span>
																		<span className="nutrition-value">
																			{data.calories.toFixed(1)} kcal
																		</span>
																	</div>
																	<div className="nutrition-item">
																		<span className="nutrition-label">蛋白质:</span>
																		<span className="nutrition-value">
																			{data.protein.toFixed(1)}g
																		</span>
																	</div>
																	<div className="nutrition-item">
																		<span className="nutrition-label">脂肪:</span>
																		<span className="nutrition-value">
																			{data.fat.toFixed(1)}g
																		</span>
																	</div>
																	<div className="nutrition-item">
																		<span className="nutrition-label">碳水:</span>
																		<span className="nutrition-value">
																			{data.carbs.toFixed(1)}g
																		</span>
																	</div>
																</div>
															</div>
														)
													)}
												</div>
											</div>
										)}

									{mealStatistics.top_foods && mealStatistics.top_foods.length > 0 && (
										<div className="top-foods">
											<h3>{t("mealStats.topCalorieSourceFoods")}</h3>
											<div className="foods-list">
												{mealStatistics.top_foods.map((food: any, index: number) => (
													<div key={index} className="food-item">
														<div className="food-rank">#{index + 1}</div>
														<div className="food-info">
															<div className="food-name">{food.name}</div>
															<div className="food-stats">
																{food.total_quantity}g • {food.total_calories.toFixed(1)} kcal
																{food.frequency > 1 && (
																	<span className="frequency"> • {food.frequency}次</span>
																)}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{isSingleMode &&
										mealStatistics.summary &&
										mealStatistics.summary.total_meals === 0 && (
											<div className="no-meals">
												<div className="no-meals-icon">🍽️</div>
												<h3>暂无餐食数据</h3>
												<p>选择的日期还没有添加任何餐食</p>
											</div>
										)}
								</>
							) : (
								<div className="no-data">
									<div className="no-data-icon">📊</div>
									<h3>暂无统计数据</h3>
									<p>请选择日期查看统计数据</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{recentMeals.length > 0 && (
				<div className="recent-meals">
					<h3>🕐 最近7天的餐食</h3>
					<div className="recent-meals-grid">
						{recentMeals.slice(0, 6).map((meal: any) => (
							<div key={meal.id} className="recent-meal-item">
								<div className="recent-meal-header">
									<span className="meal-type">
										{getMealTypeDisplayName(meal.meal_type)}
									</span>
									<span className="meal-date">{formatUTCDateToLocal(meal.date)}</span>
								</div>
								<div className="recent-meal-name">{meal.name}</div>
								<div className="recent-meal-calories">
									{meal.total_calories.toFixed(1)} kcal
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<style>{`
				.meal-stats {
					max-width: 1200px;
					margin: 0 auto;
					padding: 2rem;
				}

				.meal-stats-login-required {
					max-width: 500px;
					margin: 0 auto;
					padding: 2rem;
					text-align: center;
				}

				.login-prompt {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 3rem 2rem;
				}

				.login-prompt h2 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
				}

				.login-prompt p {
					margin: 0 0 2rem 0;
					color: #6c757d;
					font-size: 1.1rem;
				}

				.stats-controls {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 1.5rem;
					
				}

				.date-controls-wrapper {
					display: flex;
					align-items: center;
					gap: 1rem;
				}

				.show-all-btn {
					background: #6c757d;
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 6px;
					cursor: pointer;
					font-size: 0.9rem;
					font-weight: 500;
					transition: all 0.3s ease;
					white-space: nowrap;
				}

				.show-all-btn:hover {
					background: #5a6268;
					transform: translateY(-1px);
				}


				.stats-main-layout {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 2rem;
					align-items: start;
				}

				.date-selector {
					display: flex;
					align-items: center;
					gap: 1rem;
				}

				.date-selector label {
					font-weight: 500;
					color: #495057;
				}

				.date-input {
					padding: 0.5rem;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 1rem;
				}

				.loading {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
				}

				.loading-spinner {
					font-size: 3rem;
					margin-bottom: 1rem;
					animation: pulse 1.5s ease-in-out infinite;
				}

				@keyframes pulse {
					0% { opacity: 1; }
					50% { opacity: 0.7; }
					100% { opacity: 1; }
				}

				.stats-content {
					display: grid;
					gap: 2rem;
				}

				.food-basket-column {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					max-height: 70vh;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}

				.food-basket-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 1.5rem 1.5rem 1rem 1.5rem;
					border-bottom: 2px solid #f8f9fa;
					background: white;
					position: sticky;
					top: 0;
					z-index: 10;
					flex-shrink: 0;
				}

				.food-basket-header h3 {
					margin: 0;
					color: #2c3e50;
				}

				.add-meal-btn {
					background: var(--success-alt);
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 6px;
					cursor: pointer;
					font-size: 0.9rem;
					transition: all 0.3s ease;
				}

				.add-meal-btn:hover {
					background: #218838;
					transform: translateY(-1px);
				}

				.loading-meals {
					text-align: center;
					padding: 2rem;
				}

				.meal-basket-content {
					flex: 1;
					overflow-y: auto;
					padding: 0 1.5rem 1.5rem 1.5rem;
				}

				.meal-basket {
					display: grid;
					gap: 1rem;
				}

				.meal-basket-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #17a2b8;
					transition: all 0.3s ease;
				}

				.meal-basket-item:hover {
					background: #e9ecef;
					transform: translateY(-2px);
					box-shadow: var(--shadow-notification);
				}

				.meal-info {
					flex: 1;
				}

				.meal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.meal-type {
					font-weight: 600;
					color: #2c3e50;
					background: #e9ecef;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
				}

				.meal-time {
					font-size: 0.8rem;
					color: #6c757d;
				}

				.meal-name {
					font-weight: 500;
					color: #495057;
					margin-bottom: 0.25rem;
				}

				.meal-datetime {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
					margin-bottom: 0.5rem;
				}

				.meal-date {
					font-size: 0.8rem;
					color: #6c757d;
					background: #f8f9fa;
					padding: 0.2rem 0.4rem;
					border-radius: 3px;
					border: 1px solid #dee2e6;
				}

				.meal-created-time {
					font-size: 0.8rem;
					color: #6c757d;
					background: #f8f9fa;
					padding: 0.2rem 0.4rem;
					border-radius: 3px;
					border: 1px solid #dee2e6;
				}

				.meal-calories {
					font-weight: 600;
					color: #dc3545;
					margin-bottom: 0.25rem;
				}

				.meal-macros {
					font-size: 0.8rem;
					color: #6c757d;
				}

				.meal-foods {
					margin-top: 0.75rem;
					padding-top: 0.75rem;
					border-top: 1px solid #e9ecef;
				}

				.foods-header {
					font-size: 0.8rem;
					font-weight: 600;
					color: #495057;
					margin-bottom: 0.5rem;
				}

				.foods-list {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.meal-foods .food-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 0.75rem;
					padding: 0.25rem 0;
				}

				.meal-foods .food-name {
					color: #2c3e50;
					font-weight: 500;
					flex: 1;
					margin-right: 0.5rem;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.meal-foods .food-quantity {
					color: #7f8c8d;
					font-size: 0.7rem;
					background: #ecf0f1;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
					white-space: nowrap;
				}

				.more-foods {
					color: #95a5a6;
					font-style: italic;
					font-size: 0.7rem;
					text-align: center;
					padding: 0.25rem 0;
					border-top: 1px dotted #dee2e6;
					margin-top: 0.25rem;
				}

				.meal-actions {
					display: flex;
					gap: 0.5rem;
				}

				.edit-btn, .delete-btn {
					background: none;
					border: none;
					cursor: pointer;
					font-size: 1.2rem;
					padding: 0.25rem;
					border-radius: 4px;
					transition: all 0.3s ease;
				}

				.edit-btn:hover {
					background: #e3f2fd;
				}

				.delete-btn:hover {
					background: #ffebee;
				}

				.empty-basket {
					text-align: center;
					padding: 3rem 1rem;
				}

				.empty-icon {
					font-size: 3rem;
					margin-bottom: 1rem;
					opacity: 0.5;
				}

				.empty-basket p {
					color: #6c757d;
					margin-bottom: 1rem;
				}

				.add-first-meal-btn {
					background: #007bff;
					color: white;
					border: none;
					padding: 0.75rem 1.5rem;
					border-radius: 6px;
					cursor: pointer;
					font-size: 1rem;
					transition: all 0.3s ease;
				}

				.add-first-meal-btn:hover {
					background: #0056b3;
					transform: translateY(-1px);
				}

				.statistics-column {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				.stats-overview {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 2rem;
				}

				.stats-overview h3 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					font-size: 1.5rem;
				}

				.overview-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
					gap: 1rem;
				}

				.overview-item {
					display: flex;
					align-items: center;
					gap: 1rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #007bff;
				}

				.overview-icon {
					font-size: 2rem;
				}

				.overview-data {
					display: flex;
					flex-direction: column;
				}

				.overview-number {
					font-size: 1.5rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.overview-label {
					font-size: 0.9rem;
					color: #6c757d;
				}

				.meal-breakdown {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 2rem;
				}

				.meal-breakdown h3 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					font-size: 1.5rem;
				}

				.breakdown-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
					gap: 1rem;
				}

				.breakdown-item {
					background: #f8f9fa;
					border-radius: 8px;
					padding: 1.5rem;
					border-left: 4px solid var(--success-alt);
				}

				.breakdown-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
				}

				.breakdown-header h4 {
					margin: 0;
					color: #2c3e50;
					font-size: 1.2rem;
				}

				.meal-count {
					background: var(--success-alt);
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: 500;
				}

				.breakdown-nutrition {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 0.5rem;
				}

				.nutrition-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.nutrition-label {
					font-size: 0.9rem;
					color: #6c757d;
				}

				.nutrition-value {
					font-weight: 500;
					color: #2c3e50;
				}

				.top-foods {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 2rem;
				}

				.top-foods h3 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					font-size: 1.5rem;
				}

				.foods-list {
					display: grid;
					gap: 1rem;
				}

				.food-item {
					display: flex;
					align-items: center;
					gap: 1rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #ffc107;
				}

				.food-rank {
					font-size: 1.2rem;
					font-weight: bold;
					color: #ffc107;
					min-width: 2rem;
				}

				.food-info {
					flex: 1;
				}

				.food-name {
					font-weight: 500;
					color: #2c3e50;
					margin-bottom: 0.25rem;
				}

				.food-stats {
					font-size: 0.9rem;
					color: #6c757d;
				}

				.frequency {
					color: var(--success-alt);
					font-weight: 500;
				}

				.recent-meals {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 2rem;
				}

				.recent-meals h3 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					font-size: 1.5rem;
				}

				.recent-meals-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 1rem;
				}

				.recent-meal-item {
					background: #f8f9fa;
					border-radius: 8px;
					padding: 1rem;
					border-left: 4px solid #17a2b8;
				}

				.recent-meal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.meal-type {
					font-weight: 500;
					color: #2c3e50;
				}

				.meal-date {
					font-size: 0.8rem;
					color: #6c757d;
				}

				.recent-meal-name {
					font-size: 0.9rem;
					color: #495057;
					margin-bottom: 0.5rem;
				}

				.recent-meal-calories {
					font-weight: 500;
					color: #17a2b8;
				}

				.no-meals, .no-data {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
				}

				.no-meals-icon, .no-data-icon {
					font-size: 3rem;
					margin-bottom: 1rem;
					opacity: 0.5;
				}

				.no-meals h3, .no-data h3 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
				}

				.no-meals p, .no-data p {
					margin: 0;
					color: #6c757d;
				}

				.btn {
					padding: 0.75rem 1.5rem;
					border: none;
					border-radius: 6px;
					cursor: pointer;
					font-size: 1rem;
					font-weight: 500;
					text-decoration: none;
					display: inline-block;
					transition: all 0.3s ease;
				}

				.btn-primary {
					background: #007bff;
					color: white;
				}

				.btn-primary:hover {
					background: #0056b3;
					transform: translateY(-1px);
				}

				@media (max-width: 768px) {
					.meal-stats {
						padding: 1rem;
					}

					.stats-main-layout {
						grid-template-columns: 1fr;
						gap: 1rem;
					}

					.food-basket-column {
						max-height: 50vh;
					}

					.overview-grid {
						grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
					}

					.breakdown-grid {
						grid-template-columns: 1fr;
					}

					.breakdown-nutrition {
						grid-template-columns: 1fr;
					}

					.date-selector {
						flex-direction: column;
						align-items: flex-start;
					}

					.date-range-selector {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.date-controls-wrapper {
						flex-direction: column;
						align-items: stretch;
						gap: 0.75rem;
					}

					.show-all-btn {
						align-self: flex-end;
					}

					.recent-meals-grid {
						grid-template-columns: 1fr;
					}

					.meal-basket-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.meal-actions {
						align-self: flex-end;
					}
				}

				.meal-stats-login-required {
					max-width: 500px;
					margin: 0 auto;
					padding: 2rem;
					text-align: center;
				}

				.login-prompt {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					padding: 3rem 2rem;
				}

				.login-prompt h2 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
				}

				.login-prompt p {
					margin: 0 0 2rem 0;
					color: #6c757d;
					font-size: 1.1rem;
				}

				.stats-content {
					background: white;
					border-radius: 12px;
					box-shadow: var(--shadow-heavy);
					padding: 3rem;
					text-align: center;
				}

				.stats-placeholder {
					max-width: 600px;
					margin: 0 auto;
				}

				.placeholder-icon {
					font-size: 4rem;
					margin-bottom: 1.5rem;
				}

				.stats-placeholder h3 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					font-size: 1.8rem;
				}

				.stats-placeholder > p {
					margin: 0 0 2rem 0;
					color: #6c757d;
					font-size: 1.1rem;
				}

				.feature-list {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 1rem;
					margin-bottom: 2rem;
					text-align: left;
				}

				.feature-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #007bff;
					transition: all 0.3s ease;
				}

				.feature-item:hover {
					background: #e9ecef;
					transform: translateY(-2px);
					box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
				}

				.feature-icon {
					font-size: 1.2rem;
					min-width: 1.5rem;
				}

				.feature-item span:last-child {
					font-weight: 500;
					color: #495057;
				}

				.coming-soon {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 1.5rem;
					border-radius: 8px;
					margin-top: 2rem;
				}

				.coming-soon p {
					margin: 0;
					font-size: 1.1rem;
					font-weight: 500;
				}

				.btn {
					padding: 0.75rem 1.5rem;
					border: none;
					border-radius: 6px;
					cursor: pointer;
					font-size: 1rem;
					font-weight: 500;
					text-decoration: none;
					display: inline-block;
					transition: all 0.3s ease;
				}

				.btn-primary {
					background: #007bff;
					color: white;
				}

				.btn-primary:hover {
					background: #0056b3;
					transform: translateY(-1px);
				}

				@media (max-width: 768px) {
					.meal-stats {
						padding: 1rem;
					}

					.stats-content {
						padding: 2rem 1rem;
					}

					.feature-list {
						grid-template-columns: 1fr;
					}

					.feature-item {
						padding: 0.75rem;
					}
				}
			`}</style>
		</div>
	);
};

export default MealStats;
