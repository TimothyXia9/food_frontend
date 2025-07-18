import React from "react";
import { foodService } from "../services/foodService";
import { Food } from "../types/api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

interface FoodSearchProps {
	onLoginRequired: () => void;
}

const FoodSearch = ({ onLoginRequired }: FoodSearchProps) => {
	const { isAuthenticated } = useAuth();
	const { success } = useNotification();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [searchResults, setSearchResults] = React.useState<Food[]>([]);
	const [selectedMeal, setSelectedMeal] = React.useState("breakfast");
	const [showAddFoodForm, setShowAddFoodForm] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [customFood, setCustomFood] = React.useState({
		name: "",
		brand: "",
		calories: "",
		protein: "",
		fat: "",
		carbs: "",
		fiber: "",
		sugar: "",
		sodium: "",
		serving_size: "100",
	});
	const [editingFood, setEditingFood] = React.useState<Food | null>(null);
	const [viewMode, setViewMode] = React.useState<"search" | "user">("search");
	const [userFoods, setUserFoods] = React.useState<Food[]>([]);
	const [userFoodsLoading, setUserFoodsLoading] = React.useState(false);
	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await foodService.searchFoods({ query: searchQuery });
			if (response.success && response.data) {
				setSearchResults(response.data.foods);
			} else {
				setError(response.error?.message || "搜索失败");
			}
		} catch (error) {
			setError("搜索时发生错误");
			console.error("Search error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLoadUserFoods = async () => {
		if (!isAuthenticated) {
			onLoginRequired();
			return;
		}

		setUserFoodsLoading(true);
		setError(null);

		try {
			const response = await foodService.getUserFoods();
			if (response.success && response.data) {
				setUserFoods(response.data.foods);
			} else {
				setError(response.error?.message || "获取用户食物失败");
			}
		} catch (error) {
			setError("获取用户食物时发生错误");
			console.error("Load user foods error:", error);
		} finally {
			setUserFoodsLoading(false);
		}
	};

	const handleViewModeChange = (mode: "search" | "user") => {
		setViewMode(mode);
		setError(null);
		
		if (mode === "user") {
			handleLoadUserFoods();
		} else {
			setSearchResults([]);
			setSearchQuery("");
		}
	};
	const handleAddFood = (food: Food, quantity: number) => {
		console.log(`Adding ${quantity}g of ${food.name} to ${selectedMeal}`);
		// TODO: Implement meal service integration
		success(`已添加 ${quantity}g ${food.name} 到${getMealName(selectedMeal)}`);
	};
	const handleCustomFoodSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const foodData = {
				name: customFood.name,
				brand: customFood.brand,
				serving_size: parseInt(customFood.serving_size),
				calories_per_100g: parseFloat(customFood.calories),
				protein_per_100g: parseFloat(customFood.protein) || 0,
				fat_per_100g: parseFloat(customFood.fat) || 0,
				carbs_per_100g: parseFloat(customFood.carbs) || 0,
				fiber_per_100g: parseFloat(customFood.fiber) || 0,
				sugar_per_100g: parseFloat(customFood.sugar) || 0,
				sodium_per_100g: parseFloat(customFood.sodium) || 0,
			};

			const response = await foodService.createCustomFood(foodData);
			if (response.success) {
				success("自定义食物已创建！");
				setShowAddFoodForm(false);
				setEditingFood(null);
				setCustomFood({
					name: "",
					brand: "",
					calories: "",
					protein: "",
					fat: "",
					carbs: "",
					fiber: "",
					sugar: "",
					sodium: "",
					serving_size: "100",
				});
				
				// Refresh user foods list if we're in user mode
				if (viewMode === "user") {
					handleLoadUserFoods();
				}
			} else {
				setError(response.error?.message || "创建失败");
			}
		} catch (error) {
			setError("创建时发生错误");
			console.error("Create food error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCopyFood = (food: Food) => {
		// 复制食物数据到表单
		setCustomFood({
			name: food.name,
			brand: food.brand || "",
			calories: food.calories_per_100g.toString(),
			protein: food.protein_per_100g?.toString() || "0",
			fat: food.fat_per_100g?.toString() || "0",
			carbs: food.carbs_per_100g?.toString() || "0",
			fiber: food.fiber_per_100g?.toString() || "0",
			sugar: food.sugar_per_100g?.toString() || "0",
			sodium: food.sodium_per_100g?.toString() || "0",
			serving_size: food.serving_size.toString(),
		});
		setEditingFood(food);
		setShowAddFoodForm(true);
		setError(null);
	};

	const getMealName = (mealType: string) => {
		const mealNames: Record<string, string> = {
			breakfast: "早餐",
			lunch: "午餐",
			dinner: "晚餐",
			snack: "零食",
		};
		return mealNames[mealType] || mealType;
	};
	return (
		<div className="food-search">
			<div className="search-header">
				<h1>添加食物</h1>
				<div className="meal-selector">
					<label className="form-label">添加到：</label>
					<select value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} className="form-input">
						<option value="breakfast">早餐</option>
						<option value="lunch">午餐</option>
						<option value="dinner">晚餐</option>
						<option value="snack">零食</option>
					</select>
				</div>
			</div>
			
			<div className="view-mode-selector">
				<button 
					onClick={() => handleViewModeChange("search")}
					className={`view-mode-btn ${viewMode === "search" ? "active" : ""}`}
				>
					搜索食物
				</button>
				<button 
					onClick={() => handleViewModeChange("user")}
					className={`view-mode-btn ${viewMode === "user" ? "active" : ""}`}
					disabled={!isAuthenticated}
				>
					我的食物
				</button>
			</div>
			{viewMode === "search" && (
				<div className="search-section">
					<div className="search-bar">
						<input 
							type="text" 
							value={searchQuery} 
							onChange={(e) => setSearchQuery(e.target.value)} 
							placeholder="搜索食物..." 
							className="search-input" 
							onKeyPress={(e) => e.key === "Enter" && handleSearch()} 
							disabled={loading}
						/>
						<button onClick={handleSearch} className="btn btn-primary search-btn" disabled={loading}>
							{loading ? "搜索中..." : "搜索"}
						</button>
					</div>
					<div className="search-actions">
						<button 
							onClick={() => isAuthenticated ? setShowAddFoodForm(true) : onLoginRequired()} 
							className="btn btn-success"
						>
							+ 创建自定义食物
						</button>
						<button 
							className="btn btn-warning"
							onClick={() => isAuthenticated ? console.log("Camera") : onLoginRequired()}
						>
							📸 拍照识别
						</button>
					</div>
				</div>
			)}
			
			{viewMode === "user" && (
				<div className="user-foods-section">
					<div className="user-foods-header">
						<h3>我的自定义食物</h3>
						<button 
							onClick={() => isAuthenticated ? setShowAddFoodForm(true) : onLoginRequired()} 
							className="btn btn-success"
						>
							+ 创建自定义食物
						</button>
					</div>
					{userFoodsLoading && <p>加载中...</p>}
					{!userFoodsLoading && userFoods.length === 0 && (
						<p className="no-foods-message">您还没有创建任何自定义食物。点击上方按钮创建您的第一个自定义食物！</p>
					)}
				</div>
			)}
			{error && (
				<div className="error-message">
					<p>{error}</p>
				</div>
			)}
			{viewMode === "search" && searchResults.length > 0 && (
				<div className="search-results">
					<h3>搜索结果</h3>
					<div className="results-grid">
						{searchResults.map((food: Food) => (
							<FoodItem key={food.id} food={food} onAdd={handleAddFood} onLoginRequired={onLoginRequired} onCopy={handleCopyFood} />
						))}
					</div>
				</div>
			)}
			
			{viewMode === "user" && userFoods.length > 0 && (
				<div className="user-foods-results">
					<div className="results-grid">
						{userFoods.map((food: Food) => (
							<FoodItem key={food.id} food={food} onAdd={handleAddFood} onLoginRequired={onLoginRequired} onCopy={handleCopyFood} />
						))}
					</div>
				</div>
			)}
			{showAddFoodForm && (
				<div className="modal-overlay">
					<div className="modal">
						<div className="modal-header">
							<h3>{editingFood ? `复制并编辑: ${editingFood.name}` : "创建自定义食物"}</h3>
							<button onClick={() => {
								setShowAddFoodForm(false);
								setEditingFood(null);
							}} className="close-btn">
								×
							</button>
						</div>
						{error && (
							<div className="error-message">
								<p>{error}</p>
							</div>
						)}
						<form onSubmit={handleCustomFoodSubmit} className="custom-food-form">
							<div className="form-group">
								<label className="form-label">食物名称</label>
								<input 
									type="text" 
									value={customFood.name} 
									onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })} 
									className="form-input" 
									required 
									disabled={loading}
									placeholder="输入食物名称"
								/>
							</div>
							
							<div className="form-group">
								<label className="form-label">品牌</label>
								<input 
									type="text" 
									value={customFood.brand} 
									onChange={(e) => setCustomFood({ ...customFood, brand: e.target.value })} 
									className="form-input" 
									disabled={loading}
									placeholder="输入品牌名称（可选）"
								/>
							</div>


							<div className="form-row">
								<div className="form-group">
									<label className="form-label">卡路里 (每100g)</label>
									<input 
										type="number" 
										value={customFood.calories} 
										onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })} 
										className="form-input" 
										required 
										disabled={loading}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">蛋白质 (g)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.protein} 
										onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">脂肪 (g)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.fat} 
										onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">碳水化合物 (g)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.carbs} 
										onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">纤维 (g)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.fiber} 
										onChange={(e) => setCustomFood({ ...customFood, fiber: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">糖 (g)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.sugar} 
										onChange={(e) => setCustomFood({ ...customFood, sugar: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">钠 (mg)</label>
									<input 
										type="number" 
										step="0.1" 
										value={customFood.sodium} 
										onChange={(e) => setCustomFood({ ...customFood, sodium: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">分量 (g)</label>
									<input 
										type="number" 
										value={customFood.serving_size} 
										onChange={(e) => setCustomFood({ ...customFood, serving_size: e.target.value })} 
										className="form-input" 
										disabled={loading}
									/>
								</div>
							</div>

							<div className="form-actions">
								<button type="button" onClick={() => setShowAddFoodForm(false)} className="btn btn-secondary" disabled={loading}>
									取消
								</button>
								<button type="submit" className="btn btn-primary" disabled={loading}>
									{loading ? "创建中..." : "创建"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			<style>{`
				.food-search {
					max-width: 1000px;
					margin: 0 auto;
				}

				.search-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
				}
				
				.view-mode-selector {
					display: flex;
					gap: 0.5rem;
					margin-bottom: 2rem;
					border-radius: 8px;
					background: #f8f9fa;
					padding: 0.5rem;
				}
				
				.view-mode-btn {
					flex: 1;
					padding: 0.75rem 1.5rem;
					border: none;
					border-radius: 6px;
					background: transparent;
					color: #6c757d;
					cursor: pointer;
					transition: all 0.3s;
					font-weight: 500;
				}
				
				.view-mode-btn:hover:not(:disabled) {
					background: #e9ecef;
					color: #495057;
				}
				
				.view-mode-btn.active {
					background: #007bff;
					color: white;
				}
				
				.view-mode-btn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.meal-selector {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					
				}

				.meal-selector select {
					min-width: 120px;
				}
				.meal-selector .form-label {
  white-space: nowrap; 
  margin-bottom: 0; 
}

				.search-section, .user-foods-section {
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
					padding: 1.5rem;
					margin-bottom: 2rem;
				}
				
				.user-foods-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
				}
				
				.user-foods-header h3 {
					margin: 0;
					color: #2c3e50;
				}
				
				.no-foods-message {
					text-align: center;
					color: #6c757d;
					font-style: italic;
					margin: 2rem 0;
				}

				.search-bar {
					display: flex;
					gap: 1rem;
					margin-bottom: 1rem;
				}

				.search-input {
					flex: 1;
					padding: 0.75rem;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 1rem;
				}

				.search-btn {
					padding: 0.75rem 1.5rem;
					white-space: nowrap;
				}

				.search-actions {
					display: flex;
					gap: 1rem;
				}

				.error-message {
					background: #f8d7da;
					color: #721c24;
					padding: 1rem;
					border-radius: 4px;
					margin: 1rem 0;
					border: 1px solid #f5c6cb;
				}

				.error-message p {
					margin: 0;
				}

				.results-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
					gap: 1rem;
					margin-top: 1rem;
				}

				.modal-overlay {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 1000;
				}

				.modal {
					background: white;
					border-radius: 8px;
					width: 90%;
					max-width: 500px;
					max-height: 80vh;
					overflow-y: auto;
				}

				.modal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 1rem 1.5rem;
					border-bottom: 1px solid #eee;
				}

				.close-btn {
					background: none;
					border: none;
					font-size: 1.5rem;
					cursor: pointer;
					color: #999;
				}

				.custom-food-form {
					padding: 1.5rem;
				}

				.form-row {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 1rem;
				}

				.form-actions {
					display: flex;
					gap: 1rem;
					justify-content: flex-end;
					margin-top: 1.5rem;
				}

				@media (max-width: 768px) {
					.search-header {
						flex-direction: column;
						gap: 1rem;
						align-items: flex-start;
					}

					.search-bar {
						flex-direction: column;
					}

					.search-actions {
						flex-direction: column;
					}

					.form-row {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</div>
	);
};

interface FoodItemProps {
	food: Food;
	onAdd: (food: Food, quantity: number) => void;
	onLoginRequired: () => void;
	onCopy: (food: Food) => void;
}

const FoodItem = ({ food, onAdd, onLoginRequired, onCopy }: FoodItemProps) => {
	const [quantity, setQuantity] = React.useState(100);
	const [showDetails, setShowDetails] = React.useState(false);
	const [nutritionData, setNutritionData] = React.useState<Food | null>(null);
	const [loadingNutrition, setLoadingNutrition] = React.useState(false);
	const { isAuthenticated } = useAuth();

	// Use nutrition data if available, otherwise use food data
	const activeFood = nutritionData || food;
	const calculatedCalories = Math.round((activeFood.calories_per_100g * quantity) / 100);
	const calculatedProtein = Math.round(((activeFood.protein_per_100g * quantity) / 100) * 10) / 10;
	const calculatedFat = Math.round(((activeFood.fat_per_100g * quantity) / 100) * 10) / 10;
	const calculatedCarbs = Math.round(((activeFood.carbs_per_100g * quantity) / 100) * 10) / 10;

	const handleGetNutrition = async () => {
		if (!food.is_usda || !food.fdc_id) return;
		
		setLoadingNutrition(true);
		try {
			const response = await foodService.getUSDANutrition(food.fdc_id.toString());
			if (response.success && response.data) {
				// Convert USDANutritionData to Food interface
				const nutritionFood: Food = {
					id: response.data.fdc_id,
					name: response.data.food_description,
					brand: response.data.brand_owner || "",
					serving_size: 100,
					calories_per_100g: response.data.nutrients.calories,
					protein_per_100g: response.data.nutrients.protein,
					fat_per_100g: response.data.nutrients.fat,
					carbs_per_100g: response.data.nutrients.carbs,
					fiber_per_100g: response.data.nutrients.fiber,
					sugar_per_100g: response.data.nutrients.sugar,
					sodium_per_100g: response.data.nutrients.sodium,
					is_custom: false,
					is_usda: true,
					fdc_id: response.data.fdc_id
				};
				setNutritionData(nutritionFood);
			}
		} catch (error) {
			console.error("Error fetching nutrition:", error);
		} finally {
			setLoadingNutrition(false);
		}
	};
	return (
		<div className="food-item">
			<div className="food-header">
				<h4 className="food-name">{food.name}</h4>
				<div className="food-badges">
					{food.is_usda && <span className="usda-badge">USDA</span>}
					{food.brand && <span className="brand-badge">{food.brand}</span>}
					{food.is_custom && <span className="custom-badge">自定义</span>}
				</div>
			</div>

			<div className="food-nutrition">
				<div className="nutrition-summary">
					<span className="calories">
						{activeFood.calories_per_100g || 0} kcal/100g
					</span>
					<div className="nutrition-actions">
						{food.is_usda && activeFood.calories_per_100g === 0 && (
							<button 
								onClick={handleGetNutrition} 
								className="get-nutrition-btn"
								disabled={loadingNutrition}
							>
								{loadingNutrition ? "获取中..." : "获取营养"}
							</button>
						)}
						<button onClick={() => setShowDetails(!showDetails)} className="details-btn">
							{showDetails ? "收起" : "详情"}
						</button>
					</div>
				</div>

				{showDetails && (
					<div className="nutrition-details">
						<div className="nutrition-row">
							<span>蛋白质: {activeFood.protein_per_100g || 0}g</span>
							<span>脂肪: {activeFood.fat_per_100g || 0}g</span>
							<span>碳水: {activeFood.carbs_per_100g || 0}g</span>
						</div>
						{activeFood.fiber_per_100g > 0 && (
							<div className="nutrition-row">
								<span>纤维: {activeFood.fiber_per_100g}g</span>
								<span>糖: {activeFood.sugar_per_100g || 0}g</span>
								<span>钠: {activeFood.sodium_per_100g || 0}mg</span>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="add-section">
				<div className="quantity-input">
					<label>数量 (g):</label>
					<input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" className="quantity-field" />
				</div>

				<div className="calculated-nutrition">
					<div className="calc-item">
						<span className="calc-value">{calculatedCalories}</span>
						<span className="calc-label">kcal</span>
					</div>
					<div className="calc-details">
						蛋白质: {calculatedProtein}g | 脂肪: {calculatedFat}g | 碳水: {calculatedCarbs}g
					</div>
				</div>

				<div className="food-actions">
					<button 
						onClick={() => isAuthenticated ? onAdd(food, quantity) : onLoginRequired()} 
						className="btn btn-primary add-btn"
					>
						添加
					</button>
					<button 
						onClick={() => isAuthenticated ? onCopy(food) : onLoginRequired()} 
						className="btn btn-secondary copy-btn"
						title="复制为自定义食物"
					>
						复制
					</button>
				</div>
			</div>
			<style>{`
				.food-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
					transition: box-shadow 0.3s;
				}

				.food-item:hover {
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
				}

				.food-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 0.75rem;
				}

				.food-name {
					margin: 0;
					color: #2c3e50;
					flex: 1;
				}

				.food-badges {
					display: flex;
					gap: 0.5rem;
					flex-wrap: wrap;
				}

				.usda-badge {
					background: #28a745;
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.75rem;
					font-weight: bold;
				}

				.brand-badge {
					background: #17a2b8;
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.75rem;
				}

				.custom-badge {
					background: #d4edda;
					color: #155724;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
				}

				.nutrition-summary {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.nutrition-actions {
					display: flex;
					gap: 0.5rem;
				}

				.get-nutrition-btn {
					background: #28a745;
					color: white;
					border: none;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					cursor: pointer;
					font-size: 0.8rem;
				}

				.get-nutrition-btn:hover {
					background: #218838;
				}

				.get-nutrition-btn:disabled {
					background: #6c757d;
					cursor: not-allowed;
				}

				.calories {
					font-weight: bold;
					color: #3498db;
				}

				.details-btn {
					background: none;
					border: none;
					color: #6c757d;
					cursor: pointer;
					font-size: 0.9rem;
				}

				.nutrition-details {
					background: #f8f9fa;
					padding: 0.5rem;
					border-radius: 4px;
					font-size: 0.9rem;
				}

				.nutrition-row {
					display: flex;
					justify-content: space-between;
				}

				.add-section {
					border-top: 1px solid #e9ecef;
					padding-top: 1rem;
					margin-top: 1rem;
				}

				.quantity-input {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					margin-bottom: 0.75rem;
				}

				.quantity-field {
					width: 80px;
					padding: 0.25rem;
					border: 1px solid #ddd;
					border-radius: 4px;
				}

				.calculated-nutrition {
					margin-bottom: 1rem;
				}

				.calc-item {
					display: flex;
					align-items: baseline;
					gap: 0.25rem;
					margin-bottom: 0.25rem;
				}

				.calc-value {
					font-size: 1.2rem;
					font-weight: bold;
					color: #2ecc71;
				}

				.calc-label {
					font-size: 0.9rem;
					color: #6c757d;
				}

				.calc-details {
					font-size: 0.8rem;
					color: #6c757d;
				}

				.food-actions {
					display: flex;
					gap: 0.5rem;
					margin-top: 0.5rem;
				}

				.add-btn {
					flex: 1;
					padding: 0.75rem;
				}

				.copy-btn {
					flex: 1;
					padding: 0.75rem;
				}
			`}</style>
		</div>
	);
};
export default FoodSearch;
