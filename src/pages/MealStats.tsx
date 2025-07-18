import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { mealService } from "../services/mealService";
import { DateRangePicker } from "../components/DateRangePicker";

interface MealStatsProps {
	onLoginRequired: () => void;
}

const MealStats = ({ onLoginRequired }: MealStatsProps) => {
	const { isAuthenticated } = useAuth();
	const { error: showError } = useNotification();
	
	const [selectedDate, setSelectedDate] = React.useState(() => {
		const today = new Date();
		return today.toISOString().split("T")[0];
	});
	const [startDate, setStartDate] = React.useState(() => {
		const today = new Date();
		return today.toISOString().split("T")[0];
	});
	const [endDate, setEndDate] = React.useState(() => {
		const today = new Date();
		return today.toISOString().split("T")[0];
	});
	const [isSingleMode, setIsSingleMode] = React.useState(true);
	const [mealStatistics, setMealStatistics] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);
	const [recentMeals, setRecentMeals] = React.useState<any[]>([]);
	const [currentMeals, setCurrentMeals] = React.useState<any[]>([]);
	const [loadingMeals, setLoadingMeals] = React.useState(false);

	React.useEffect(() => {
		if (!isAuthenticated) {
			onLoginRequired();
		}
	}, [isAuthenticated, onLoginRequired]);

	React.useEffect(() => {
		if (isAuthenticated) {
			loadMealStatistics();
			loadRecentMeals();
			loadCurrentMeals();
		}
	}, [isAuthenticated, selectedDate, startDate, endDate, isSingleMode]);

	const loadMealStatistics = async () => {
		if (!isAuthenticated) return;
		
		setLoading(true);
		try {
			if (!isSingleMode) {
				// Load statistics for date range
				const response = await mealService.getNutritionStats(startDate, endDate);
				if (response.success) {
					setMealStatistics(response.data);
				} else {
					showError(response.error?.message || "获取时段统计失败");
				}
			} else {
				// Load statistics for single date
				const response = await mealService.getMealStatistics(selectedDate);
				if (response.success) {
					setMealStatistics(response.data);
				} else {
					showError(response.error?.message || "获取餐食统计失败");
				}
			}
		} catch (error) {
			console.error("Load meal statistics error:", error);
			showError("获取餐食统计时发生错误");
		} finally {
			setLoading(false);
		}
	};

	const loadRecentMeals = async () => {
		if (!isAuthenticated) return;
		
		try {
			const response = await mealService.getRecentMeals(7);
			if (response.success && response.data) {
				setRecentMeals(response.data.meals || []);
			}
		} catch (error) {
			console.error("Load recent meals error:", error);
		}
	};

	const loadCurrentMeals = async () => {
		if (!isAuthenticated) return;
		
		setLoadingMeals(true);
		try {
			const currentDate = isSingleMode ? selectedDate : startDate;
			const response = await mealService.getUserMeals({ 
				date: currentDate,
				page_size: 100
			});
			if (response.success && response.data) {
				setCurrentMeals(response.data.meals || []);
			}
		} catch (error) {
			console.error("Load current meals error:", error);
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
				sessionStorage.setItem("editingMeal", JSON.stringify({
					id: mealData.id,
					name: mealData.name,
					date: mealData.date,
					meal_type: mealData.meal_type,
					foods: mealData.foods || [],
					total_calories: mealData.total_calories,
					notes: mealData.notes
				}));
				
				// Navigate to food search page with meal editing context
				window.location.href = `/?edit_meal=${mealId}`;
			} else {
				showError(response.error?.message || "获取餐食详情失败");
			}
		} catch (error) {
			console.error("Load meal details error:", error);
			showError("获取餐食详情时发生错误");
		}
	};

	const handleDeleteMeal = async (mealId: number) => {
		if (!window.confirm("确定要删除这顿餐食吗？")) return;
		
		try {
			const response = await mealService.deleteMeal(mealId);
			if (response.success) {
				await loadCurrentMeals();
				await loadMealStatistics();
			} else {
				showError(response.error?.message || "删除餐食失败");
			}
		} catch (error) {
			console.error("Delete meal error:", error);
			showError("删除餐食时发生错误");
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long"
		};
		return date.toLocaleDateString("zh-CN", options);
	};

	const getMealTypeDisplayName = (mealType: string) => {
		const names: Record<string, string> = {
			breakfast: "早餐",
			lunch: "午餐",
			dinner: "晚餐",
			snack: "零食"
		};
		return names[mealType] || mealType;
	};

	if (!isAuthenticated) {
		return (
			<div className="meal-stats-login-required">
				<div className="login-prompt">
					<h2>📊 每餐统计</h2>
					<p>请登录以查看您的食物篮统计数据</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						登录查看
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="meal-stats">
			<div className="stats-header">
				<h1>📊 每餐统计</h1>
				<p>查看您每餐的营养摄入情况和统计数据</p>
			</div>

			<div className="stats-controls">
				<DateRangePicker
					startDate={isSingleMode ? selectedDate : startDate}
					endDate={isSingleMode ? selectedDate : endDate}
					onStartDateChange={(date) => {
						if (isSingleMode) {
							setSelectedDate(date);
						} else {
							setStartDate(date);
						}
					}}
					onEndDateChange={(date) => {
						if (isSingleMode) {
							setSelectedDate(date);
						} else {
							setEndDate(date);
						}
					}}
					isSingleMode={isSingleMode}
					onModeChange={setIsSingleMode}
				/>
			</div>

			{loading ? (
				<div className="loading">
					<div className="loading-spinner">📊</div>
					<p>正在加载统计数据...</p>
				</div>
			) : (
				<div className="stats-content">
					<div className="stats-main-layout">
						{/* Left Column - Food Basket */}
						<div className="food-basket-column">
							<div className="food-basket-header">
								<h3>🍽️ 我的食物篮</h3>
								<button 
									className="add-meal-btn"
									onClick={() => window.location.href = "/"}
								>
									+ 添加餐食
								</button>
							</div>
							
							{loadingMeals ? (
								<div className="loading-meals">
									<div className="loading-spinner">🍽️</div>
									<p>正在加载餐食...</p>
								</div>
							) : (
								<div className="meal-basket">
									{currentMeals.length > 0 ? (
										currentMeals.map((meal: any) => (
											<div key={meal.id} className="meal-basket-item">
												<div className="meal-info">
													<div className="meal-header">
														<span className="meal-type">{getMealTypeDisplayName(meal.meal_type)}</span>
														<span className="meal-time">{new Date(meal.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
													</div>
													<div className="meal-name">{meal.name || "未命名餐食"}</div>
													<div className="meal-calories">{meal.total_calories.toFixed(1)} kcal</div>
													<div className="meal-macros">
														蛋白质: {meal.total_protein.toFixed(1)}g | 
														脂肪: {meal.total_fat.toFixed(1)}g | 
														碳水: {meal.total_carbs.toFixed(1)}g
													</div>
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
											<p>今天还没有添加任何餐食</p>
											<button 
												className="add-first-meal-btn"
												onClick={() => window.location.href = "/"}
											>
												添加第一餐
											</button>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Right Column - Statistics */}
						<div className="statistics-column">
							{mealStatistics ? (
								<>
									<div className="stats-overview">
										<h3>📅 {!isSingleMode ? `${startDate} 至 ${endDate}` : formatDate(selectedDate)} 统计概览</h3>
										<div className="overview-grid">
											<div className="overview-item">
												<div className="overview-icon">🍽️</div>
												<div className="overview-data">
													<span className="overview-number">{!isSingleMode ? mealStatistics.stats?.date_range?.days_count || 0 : mealStatistics.summary?.total_meals || 0}</span>
													<span className="overview-label">{!isSingleMode ? "天数" : "餐次"}</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🔥</div>
												<div className="overview-data">
													<span className="overview-number">{!isSingleMode ? mealStatistics.stats?.totals?.calories || 0 : mealStatistics.summary?.total_calories || 0}</span>
													<span className="overview-label">卡路里</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🥩</div>
												<div className="overview-data">
													<span className="overview-number">{!isSingleMode ? mealStatistics.stats?.totals?.protein || 0 : mealStatistics.summary?.total_protein || 0}g</span>
													<span className="overview-label">蛋白质</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🥑</div>
												<div className="overview-data">
													<span className="overview-number">{!isSingleMode ? mealStatistics.stats?.totals?.fat || 0 : mealStatistics.summary?.total_fat || 0}g</span>
													<span className="overview-label">脂肪</span>
												</div>
											</div>
											<div className="overview-item">
												<div className="overview-icon">🍞</div>
												<div className="overview-data">
													<span className="overview-number">{!isSingleMode ? mealStatistics.stats?.totals?.carbs || 0 : mealStatistics.summary?.total_carbs || 0}g</span>
													<span className="overview-label">碳水化合物</span>
												</div>
											</div>
										</div>
									</div>

									{isSingleMode && mealStatistics.meal_breakdown && Object.keys(mealStatistics.meal_breakdown).length > 0 && (
										<div className="meal-breakdown">
											<h3>🍽️ 各餐营养分布</h3>
											<div className="breakdown-grid">
												{Object.entries(mealStatistics.meal_breakdown).map(([mealType, data]: [string, any]) => (
													<div key={mealType} className="breakdown-item">
														<div className="breakdown-header">
															<h4>{getMealTypeDisplayName(mealType)}</h4>
															<span className="meal-count">{data.count} 餐</span>
														</div>
														<div className="breakdown-nutrition">
															<div className="nutrition-item">
																<span className="nutrition-label">卡路里:</span>
																<span className="nutrition-value">{data.calories.toFixed(1)} kcal</span>
															</div>
															<div className="nutrition-item">
																<span className="nutrition-label">蛋白质:</span>
																<span className="nutrition-value">{data.protein.toFixed(1)}g</span>
															</div>
															<div className="nutrition-item">
																<span className="nutrition-label">脂肪:</span>
																<span className="nutrition-value">{data.fat.toFixed(1)}g</span>
															</div>
															<div className="nutrition-item">
																<span className="nutrition-label">碳水:</span>
																<span className="nutrition-value">{data.carbs.toFixed(1)}g</span>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{mealStatistics.top_foods && mealStatistics.top_foods.length > 0 && (
										<div className="top-foods">
											<h3>🥇 当日热量来源食物</h3>
											<div className="foods-list">
												{mealStatistics.top_foods.map((food: any, index: number) => (
													<div key={index} className="food-item">
														<div className="food-rank">#{index + 1}</div>
														<div className="food-info">
															<div className="food-name">{food.name}</div>
															<div className="food-stats">
																{food.total_quantity}g • {food.total_calories.toFixed(1)} kcal
																{food.frequency > 1 && <span className="frequency"> • {food.frequency}次</span>}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{isSingleMode && mealStatistics.summary && mealStatistics.summary.total_meals === 0 && (
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
									<span className="meal-type">{getMealTypeDisplayName(meal.meal_type)}</span>
									<span className="meal-date">{new Date(meal.date).toLocaleDateString("zh-CN")}</span>
								</div>
								<div className="recent-meal-name">{meal.name}</div>
								<div className="recent-meal-calories">{meal.total_calories.toFixed(1)} kcal</div>
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

				.stats-header {
					text-align: center;
					margin-bottom: 2rem;
				}

				.stats-header h1 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 2.5rem;
				}

				.stats-header p {
					margin: 0;
					color: #6c757d;
					font-size: 1.2rem;
				}

				.stats-controls {
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
					padding: 1.5rem;
					margin-bottom: 2rem;
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
					padding: 1.5rem;
					max-height: 70vh;
					overflow-y: auto;
				}

				.food-basket-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
					padding-bottom: 1rem;
					border-bottom: 2px solid #f8f9fa;
				}

				.food-basket-header h3 {
					margin: 0;
					color: #2c3e50;
				}

				.add-meal-btn {
					background: #28a745;
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
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

				.meal-calories {
					font-weight: 600;
					color: #dc3545;
					margin-bottom: 0.25rem;
				}

				.meal-macros {
					font-size: 0.8rem;
					color: #6c757d;
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
					border-left: 4px solid #28a745;
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
					background: #28a745;
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
					color: #28a745;
					font-weight: 500;
				}

				.recent-meals {
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

					.stats-header h1 {
						font-size: 2rem;
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
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

				.stats-header {
					text-align: center;
					margin-bottom: 3rem;
				}

				.stats-header h1 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 2.5rem;
				}

				.stats-header p {
					margin: 0;
					color: #6c757d;
					font-size: 1.2rem;
				}

				.stats-content {
					background: white;
					border-radius: 12px;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

					.stats-header h1 {
						font-size: 2rem;
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