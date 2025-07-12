import React from "react";
const FoodSearch = () => {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [searchResults, setSearchResults] = React.useState<any[]>([]);
	const [selectedMeal, setSelectedMeal] = React.useState("breakfast");
	const [showAddFoodForm, setShowAddFoodForm] = React.useState(false);
	const [customFood, setCustomFood] = React.useState({
		name: "",
		calories: "",
		protein: "",
		fat: "",
		carbs: "",
		serving_size: "100",
	});
	const mockSearchResults = [
		{
			id: 1,
			name: "苹果",
			calories_per_100g: 52,
			protein_per_100g: 0.3,
			fat_per_100g: 0.2,
			carbs_per_100g: 14,
			category: "水果",
			is_custom: false,
		},
		{
			id: 2,
			name: "鸡胸肉",
			calories_per_100g: 165,
			protein_per_100g: 31,
			fat_per_100g: 3.6,
			carbs_per_100g: 0,
			category: "肉类",
			is_custom: false,
		},
		{
			id: 3,
			name: "我的自制沙拉",
			calories_per_100g: 120,
			protein_per_100g: 8.5,
			fat_per_100g: 6.0,
			carbs_per_100g: 15,
			category: "自定义",
			is_custom: true,
		},
	];
	const handleSearch = () => {
		if (searchQuery.trim()) {
			const filtered = mockSearchResults.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()));
			setSearchResults(filtered);
		} else {
			setSearchResults([]);
		}
	};
	const handleAddFood = (food: any, quantity: number) => {
		console.log(`Adding ${quantity}g of ${food.name} to ${selectedMeal}`);

		alert(`已添加 ${quantity}g ${food.name} 到${getMealName(selectedMeal)}`);
	};
	const handleCustomFoodSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Creating custom food:", customFood);

		alert("自定义食物已创建！");
		setShowAddFoodForm(false);
		setCustomFood({
			name: "",
			calories: "",
			protein: "",
			fat: "",
			carbs: "",
			serving_size: "100",
		});
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
			<div className="search-section">
				<div className="search-bar">
					<input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索食物..." className="search-input" onKeyPress={(e) => e.key === "Enter" && handleSearch()} />
					<button onClick={handleSearch} className="btn btn-primary search-btn">
						搜索
					</button>
				</div>
				<div className="search-actions">
					<button onClick={() => setShowAddFoodForm(true)} className="btn btn-success">
						+ 创建自定义食物
					</button>
					<button className="btn btn-warning">📸 拍照识别</button>
				</div>
			</div>
			{searchResults.length > 0 && (
				<div className="search-results">
					<h3>搜索结果</h3>
					<div className="results-grid">
						{searchResults.map((food: any) => (
							<FoodItem key={food.id} food={food} onAdd={handleAddFood} />
						))}
					</div>
				</div>
			)}
			{showAddFoodForm && (
				<div className="modal-overlay">
					<div className="modal">
						<div className="modal-header">
							<h3>创建自定义食物</h3>
							<button onClick={() => setShowAddFoodForm(false)} className="close-btn">
								×
							</button>
						</div>
						<form onSubmit={handleCustomFoodSubmit} className="custom-food-form">
							<div className="form-group">
								<label className="form-label">食物名称</label>
								<input type="text" value={customFood.name} onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })} className="form-input" required />
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">卡路里 (每100g)</label>
									<input type="number" value={customFood.calories} onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })} className="form-input" required />
								</div>
								<div className="form-group">
									<label className="form-label">蛋白质 (g)</label>
									<input type="number" step="0.1" value={customFood.protein} onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })} className="form-input" />
								</div>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">脂肪 (g)</label>
									<input type="number" step="0.1" value={customFood.fat} onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })} className="form-input" />
								</div>
								<div className="form-group">
									<label className="form-label">碳水化合物 (g)</label>
									<input type="number" step="0.1" value={customFood.carbs} onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })} className="form-input" />
								</div>
							</div>

							<div className="form-actions">
								<button type="button" onClick={() => setShowAddFoodForm(false)} className="btn btn-secondary">
									取消
								</button>
								<button type="submit" className="btn btn-primary">
									创建
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
					margin-bottom: 2rem;
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

				.search-section {
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
					padding: 1.5rem;
					margin-bottom: 2rem;
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

const FoodItem = ({ food, onAdd }: { food: any; onAdd: (food: any, quantity: number) => void }) => {
	const [quantity, setQuantity] = React.useState(100);
	const [showDetails, setShowDetails] = React.useState(false);

	const calculatedCalories = Math.round((food.calories_per_100g * quantity) / 100);
	const calculatedProtein = Math.round(((food.protein_per_100g * quantity) / 100) * 10) / 10;
	const calculatedFat = Math.round(((food.fat_per_100g * quantity) / 100) * 10) / 10;
	const calculatedCarbs = Math.round(((food.carbs_per_100g * quantity) / 100) * 10) / 10;
	return (
		<div className="food-item">
			<div className="food-header">
				<h4 className="food-name">{food.name}</h4>
				<span className={`food-category ${food.is_custom ? "custom" : ""}`}>{food.category}</span>
			</div>

			<div className="food-nutrition">
				<div className="nutrition-summary">
					<span className="calories">{food.calories_per_100g} kcal/100g</span>
					<button onClick={() => setShowDetails(!showDetails)} className="details-btn">
						{showDetails ? "收起" : "详情"}
					</button>
				</div>

				{showDetails && (
					<div className="nutrition-details">
						<div className="nutrition-row">
							<span>蛋白质: {food.protein_per_100g}g</span>
							<span>脂肪: {food.fat_per_100g}g</span>
							<span>碳水: {food.carbs_per_100g}g</span>
						</div>
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

				<button onClick={() => onAdd(food, quantity)} className="btn btn-primary add-btn">
					添加
				</button>
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
					align-items: center;
					margin-bottom: 0.75rem;
				}

				.food-name {
					margin: 0;
					color: #2c3e50;
				}

				.food-category {
					background: #e9ecef;
					color: #6c757d;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
				}

				.food-category.custom {
					background: #d4edda;
					color: #155724;
				}

				.nutrition-summary {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
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

				.add-btn {
					width: 100%;
					padding: 0.75rem;
				}
			`}</style>
		</div>
	);
};
export default FoodSearch;
