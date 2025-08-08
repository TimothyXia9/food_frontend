import React from "react";
import { useNavigate } from "react-router-dom";
import { foodService } from "../services/foodService";
import { mealService } from "../services/mealService";
import { Food } from "../types/api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { DateTimePicker } from "../components/DateTimePicker";
import FoodSearchToolbar from "../components/FoodSearchToolbar";
import { getCurrentLocalDateTime, createLocalDateTime, localToUTC } from "../utils/timezone";

interface FoodSearchProps {
	onLoginRequired: () => void;
}

const FoodSearch = ({ onLoginRequired }: FoodSearchProps) => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const { showSuccess, showError, showConfirm } = useNotification();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [searchResults, setSearchResults] = React.useState<Food[]>([]);
	// const [selectedMeal] = React.useState("breakfast");
	const [showAddFoodForm, setShowAddFoodForm] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [customFood, setCustomFood] = React.useState({
		name: "",
		calories: "",
		protein: "",
		fat: "",
		carbs: "",
		fiber: "",
		sugar: "",
		sodium: "",
	});
	const [editingFood, setEditingFood] = React.useState<Food | null>(null);
	const [viewMode, setViewMode] = React.useState<"search" | "user">("search");
	const [userFoods, setUserFoods] = React.useState<Food[]>([]);
	const [userFoodsLoading, setUserFoodsLoading] = React.useState(false);
	const [isSavingMeal, setIsSavingMeal] = React.useState(false);

	// Note: getCurrentLocalDateTime is now imported from utils/timezone

	// Helper function to format datetime as meal name
	const formatDateTimeAsName = (dateTimeString: string) => {
		const date = createLocalDateTime(dateTimeString);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	};

	// Load meal cart from localStorage
	const loadMealCartFromStorage = () => {
		try {
			const savedCart = localStorage.getItem("mealCart");
			const savedName = localStorage.getItem("mealName");
			const savedTime = localStorage.getItem("mealTime");
			return {
				cart: savedCart ? JSON.parse(savedCart) : [],
				name: savedName || "",
				time: savedTime || getCurrentLocalDateTime(),
			};
		} catch (error) {
			console.error("Error loading meal cart from storage:", error);
			return {
				cart: [],
				name: "",
				time: getCurrentLocalDateTime(),
			};
		}
	};

	// Initialize state with data from localStorage or editing meal (only if authenticated)
	const initialData = isAuthenticated
		? loadMealCartFromStorage()
		: { cart: [], name: "", time: getCurrentLocalDateTime() };
	const [mealCart, setMealCart] = React.useState<
		{ food: Food; quantity: number; updated?: boolean }[]
	>(initialData.cart);
	const [mealName, setMealName] = React.useState(initialData.name);
	const [mealTime, setMealTime] = React.useState(initialData.time);
	const [editingMealId, setEditingMealId] = React.useState<number | null>(null);

	// Clear meal cart when user is not authenticated
	React.useEffect(() => {
		if (!isAuthenticated) {
			setMealCart([]);
			setMealName("");
			setMealTime(getCurrentLocalDateTime());
			setEditingMealId(null);
			// Clear localStorage as well
			localStorage.removeItem("mealCart");
			localStorage.removeItem("mealName");
			localStorage.removeItem("mealTime");
			sessionStorage.removeItem("editingMeal");
		}
	}, [isAuthenticated]);

	// Save meal cart to localStorage whenever it changes (only if authenticated)
	React.useEffect(() => {
		if (isAuthenticated) {
			localStorage.setItem("mealCart", JSON.stringify(mealCart));
		}
	}, [mealCart, isAuthenticated]);

	// Save meal name to localStorage whenever it changes (only if authenticated)
	React.useEffect(() => {
		if (isAuthenticated) {
			localStorage.setItem("mealName", mealName);
		}
	}, [mealName, isAuthenticated]);

	// Save meal time to localStorage whenever it changes (only if authenticated)
	React.useEffect(() => {
		if (isAuthenticated) {
			localStorage.setItem("mealTime", mealTime);
		}
	}, [mealTime, isAuthenticated]);

	// Check for editing meal data on component mount
	React.useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const editMealId = urlParams.get("edit_meal");

		if (editMealId) {
			// Load editing meal data from sessionStorage
			const editingMealData = sessionStorage.getItem("editingMeal");
			if (editingMealData) {
				try {
					const mealData = JSON.parse(editingMealData);

					// Set editing meal ID
					setEditingMealId(parseInt(editMealId));

					// Set meal name and time
					setMealName(mealData.name || "");
					if (mealData.date) {
						// Convert date to datetime format for the picker
						if (!mealData.date.includes("T")) {
							// If only date provided, use current local time
							const currentTime = getCurrentLocalDateTime();
							const timeOnly = currentTime.split("T")[1]; // Extract HH:MM
							setMealTime(`${mealData.date}T${timeOnly}`);
						} else {
							// Already includes time
							setMealTime(mealData.date);
						}
					}

					// Convert meal foods to cart format
					if (mealData.foods && mealData.foods.length > 0) {
						const cartItems = mealData.foods.map((mealFood: any) => ({
							food: {
								id: mealFood.food_id,
								name: mealFood.food_name,
								calories_per_100g: (mealFood.calories / mealFood.quantity) * 100,
								protein_per_100g: (mealFood.protein / mealFood.quantity) * 100,
								fat_per_100g: (mealFood.fat / mealFood.quantity) * 100,
								carbs_per_100g: (mealFood.carbs / mealFood.quantity) * 100,
								fiber_per_100g: 0,
								sugar_per_100g: 0,
								sodium_per_100g: 0,
								serving_size: 100,
								is_custom: false,
								is_usda: false,
							} as Food,
							quantity: mealFood.quantity,
							updated: false,
						}));
						setMealCart(cartItems);
					}

					showSuccess(`已加载食物篮: ${mealData.name || "未命名"}`);
				} catch (error) {
					console.error("Error loading editing meal data:", error);
					showError("加载编辑餐食数据时发生错误");
				}
			}

			// Clean up URL parameter - use pushState to avoid triggering re-render
			const newUrl = window.location.pathname;
			window.history.replaceState(null, "", newUrl);
		}
	}, [showSuccess, showError]);
	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setLoading(true);
		setErrorMessage(null);

		try {
			const response = await foodService.searchFoods({ query: searchQuery });
			if (response.success && response.data) {
				setSearchResults(response.data.foods);
			} else {
				setErrorMessage(response.error?.message || "搜索失败");
			}
		} catch (error) {
			setErrorMessage("搜索时发生错误");
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
		setErrorMessage(null);

		try {
			const response = await foodService.getUserFoods();
			if (response.success && response.data) {
				setUserFoods(response.data.foods);
			} else {
				setErrorMessage(response.error?.message || "获取用户食物失败");
			}
		} catch (error) {
			setErrorMessage("获取用户食物时发生错误");
			console.error("Load user foods error:", error);
		} finally {
			setUserFoodsLoading(false);
		}
	};

	const handleViewModeChange = (mode: "search" | "user") => {
		setViewMode(mode);
		setErrorMessage(null);

		if (mode === "user") {
			handleLoadUserFoods();
		} else {
			setSearchResults([]);
			setSearchQuery("");
		}
	};
	const handleAddFood = (food: Food, quantity: number) => {
		// Check authentication before adding to cart
		if (!isAuthenticated) {
			onLoginRequired();
			return;
		}

		// Add to meal cart - preserve the original food properties including USDA status
		const existingIndex = mealCart.findIndex(item => item.food.id === food.id);
		if (existingIndex >= 0) {
			// Update existing item quantity
			const newCart = [...mealCart];
			newCart[existingIndex].quantity += quantity;
			setMealCart(newCart);
		} else {
			// Add new item, ensuring USDA properties are preserved
			setMealCart([...mealCart, { food, quantity }]);
		}
		showSuccess(`已添加 ${quantity}g ${food.name} 到食物篮`);
	};

	const handleRemoveFromCart = (foodId: number) => {
		setMealCart(mealCart.filter(item => item.food.id !== foodId));
	};

	const handleUpdateCartQuantity = (foodId: number, newQuantity: number) => {
		if (newQuantity <= 0) {
			handleRemoveFromCart(foodId);
			return;
		}
		setMealCart(
			mealCart.map(item =>
				item.food.id === foodId ? { ...item, quantity: newQuantity, updated: false } : item
			)
		);
	};

	const clearUpdatedStatus = (foodId: number) => {
		setMealCart(prevCart =>
			prevCart.map(item => (item.food.id === foodId ? { ...item, updated: false } : item))
		);
	};

	const handleClearCart = async () => {
		const confirmed = await showConfirm("确定要清空所有食物吗？");
		if (confirmed) {
			setMealCart([]);
			setMealName("");
			setMealTime(getCurrentLocalDateTime());
			// Clear localStorage as well
			localStorage.removeItem("mealCart");
			localStorage.removeItem("mealName");
			localStorage.removeItem("mealTime");
			showSuccess("已清空食物篮");
		}
	};

	const handleSaveMeal = async () => {
		if (!isAuthenticated) {
			onLoginRequired();
			return;
		}

		if (mealCart.length === 0) {
			showError("请先添加食物到食物篮");
			return;
		}

		// 防抖保护：如果正在保存中，直接返回
		if (isSavingMeal) {
			return;
		}

		// Use datetime as name if no name is provided
		const finalMealName = mealName || formatDateTimeAsName(mealTime);

		setIsSavingMeal(true);
		try {
			// Extract date and determine meal type from time
			const mealDateTime = createLocalDateTime(mealTime);
			const hour = mealDateTime.getHours();

			// 将本地时间转换为UTC时间发送给后端
			const utcDateTime = localToUTC(mealDateTime);

			// Determine meal type based on time
			let mealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
			if (hour >= 5 && hour < 11) {
				mealType = "breakfast";
			} else if (hour >= 11 && hour < 16) {
				mealType = "lunch";
			} else if (hour >= 16 && hour < 22) {
				mealType = "dinner";
			}

			// Prepare foods data for API
			const foods = mealCart.map(item => {
				if (item.food.is_usda && item.food.fdc_id) {
					// For USDA foods, send placeholder food_id and include USDA data
					return {
						food_id: -1, // Placeholder for non-existent food
						quantity: item.quantity,
						fdc_id: item.food.fdc_id,
						name: item.food.name,
					};
				} else {
					// For regular foods, send the actual food_id
					return {
						food_id: item.food.id,
						quantity: item.quantity,
					};
				}
			});

			let response;
			if (editingMealId) {
				// Update existing meal
				const updateData = {
					date: utcDateTime,
					meal_type: mealType,
					name: finalMealName,
					foods: foods,
				};
				response = await mealService.updateMeal(editingMealId, updateData);
			} else {
				// Create new meal
				const createData = {
					date: utcDateTime,
					meal_type: mealType,
					name: finalMealName,
					foods: foods,
				};
				response = await mealService.createMeal(createData);
			}

			if (response.success) {
				showSuccess(`已${editingMealId ? "更新" : "保存"}食物篮: ${finalMealName}`);
				// Clear meal cart and localStorage after successful save
				setMealCart([]);
				setMealName("");
				setMealTime(getCurrentLocalDateTime());
				setEditingMealId(null);
				localStorage.removeItem("mealCart");
				localStorage.removeItem("mealName");
				localStorage.removeItem("mealTime");
				sessionStorage.removeItem("editingMeal");
			} else {
				showError(
					response.error?.message || `${editingMealId ? "更新" : "保存"}食物篮失败`
				);
			}
		} catch (error) {
			console.error("Save meal error:", error);
			showError(`${editingMealId ? "更新" : "保存"}食物篮时发生错误`);
		} finally {
			setIsSavingMeal(false);
		}
	};

	const getTotalNutrition = () => {
		return mealCart.reduce(
			(total, item) => {
				const calories = (item.food.calories_per_100g * item.quantity) / 100;
				const protein = ((item.food.protein_per_100g || 0) * item.quantity) / 100;
				const fat = ((item.food.fat_per_100g || 0) * item.quantity) / 100;
				const carbs = ((item.food.carbs_per_100g || 0) * item.quantity) / 100;

				return {
					calories: total.calories + calories,
					protein: total.protein + protein,
					fat: total.fat + fat,
					carbs: total.carbs + carbs,
				};
			},
			{ calories: 0, protein: 0, fat: 0, carbs: 0 }
		);
	};
	const handleCustomFoodSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMessage(null);

		try {
			const foodData = {
				name: customFood.name,
				serving_size: 100, // Default serving size
				calories_per_100g: parseFloat(customFood.calories),
				protein_per_100g: parseFloat(customFood.protein) || 0,
				fat_per_100g: parseFloat(customFood.fat) || 0,
				carbs_per_100g: parseFloat(customFood.carbs) || 0,
				fiber_per_100g: parseFloat(customFood.fiber) || 0,
				sugar_per_100g: parseFloat(customFood.sugar) || 0,
				sodium_per_100g: parseFloat(customFood.sodium) || 0,
			};

			// Check if we're editing an existing user food
			const isEditingUserFood = editingFood && editingFood.is_custom;

			let response;
			if (isEditingUserFood) {
				response = await foodService.updateCustomFood(editingFood.id, foodData);
			} else {
				response = await foodService.createCustomFood(foodData);
			}

			if (response.success) {
				showSuccess(isEditingUserFood ? "自定义食物已更新！" : "自定义食物已创建！");

				// Update meal cart if the edited food is in the cart
				if (isEditingUserFood && response.data && editingFood) {
					const updatedFood: Food = {
						...editingFood,
						name: response.data.name || foodData.name,
						calories_per_100g:
							response.data.calories_per_100g || foodData.calories_per_100g,
						protein_per_100g:
							response.data.protein_per_100g || foodData.protein_per_100g,
						fat_per_100g: response.data.fat_per_100g || foodData.fat_per_100g,
						carbs_per_100g: response.data.carbs_per_100g || foodData.carbs_per_100g,
						fiber_per_100g: response.data.fiber_per_100g || foodData.fiber_per_100g,
						sugar_per_100g: response.data.sugar_per_100g || foodData.sugar_per_100g,
						sodium_per_100g: response.data.sodium_per_100g || foodData.sodium_per_100g,
					};

					// Update cart if this food is in the cart
					const isInCart = mealCart.some(item => item.food.id === editingFood.id);
					if (isInCart) {
						setMealCart(prevCart =>
							prevCart.map(item =>
								item.food.id === editingFood.id
									? { ...item, food: updatedFood, updated: true }
									: item
							)
						);
						showSuccess("食物篮中的营养信息已同步更新！");
					}
				}

				setShowAddFoodForm(false);
				resetForm();

				// Refresh user foods list if we're in user mode
				if (viewMode === "user") {
					handleLoadUserFoods();
				}
			} else {
				setErrorMessage(
					response.error?.message || (isEditingUserFood ? "更新失败" : "创建失败")
				);
			}
		} catch (error) {
			setErrorMessage("创建时发生错误");
			console.error("Create food error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCopyFood = (food: Food) => {
		// 复制食物数据到表单
		setCustomFood({
			name: food.name,
			calories: food.calories_per_100g.toString(),
			protein: food.protein_per_100g?.toString() || "0",
			fat: food.fat_per_100g?.toString() || "0",
			carbs: food.carbs_per_100g?.toString() || "0",
			fiber: food.fiber_per_100g?.toString() || "0",
			sugar: food.sugar_per_100g?.toString() || "0",
			sodium: food.sodium_per_100g?.toString() || "0",
		});
		setEditingFood(food);
		setShowAddFoodForm(true);
		setErrorMessage(null);
	};

	const resetForm = () => {
		setCustomFood({
			name: "",
			calories: "",
			protein: "",
			fat: "",
			carbs: "",
			fiber: "",
			sugar: "",
			sodium: "",
		});
		setEditingFood(null);
		setErrorMessage(null);
	};

	const handleEditFood = (food: Food) => {
		// 编辑用户自定义食物
		setCustomFood({
			name: food.name,
			calories: food.calories_per_100g.toString(),
			protein: food.protein_per_100g?.toString() || "0",
			fat: food.fat_per_100g?.toString() || "0",
			carbs: food.carbs_per_100g?.toString() || "0",
			fiber: food.fiber_per_100g?.toString() || "0",
			sugar: food.sugar_per_100g?.toString() || "0",
			sodium: food.sodium_per_100g?.toString() || "0",
		});
		setEditingFood(food);
		setShowAddFoodForm(true);
		setErrorMessage(null);
	};

	const handleDeleteFood = async (food: Food) => {
		// Check if food is in the meal cart
		const isInCart = mealCart.some(item => item.food.id === food.id);

		// Build comprehensive confirmation message
		let confirmMessage = `确定要删除食物 "${food.name}" 吗？此操作无法撤销。`;
		if (isInCart) {
			confirmMessage += "\n\n⚠️ 该食物将从以下位置移除：";
			confirmMessage += "\n• 当前食物篮";
			confirmMessage += "\n• 所有已保存的餐食记录（如有）";
		} else {
			confirmMessage += "\n\n⚠️ 该食物将从所有已保存的餐食记录中移除（如有）。";
		}

		const confirmed = await showConfirm(confirmMessage);
		if (!confirmed) {
			return;
		}

		try {
			const response = await foodService.deleteCustomFood(food.id);
			if (response.success) {
				// Remove food from meal cart if it was there
				if (isInCart) {
					setMealCart(prevCart => prevCart.filter(item => item.food.id !== food.id));
				}

				// Build comprehensive success message
				let successMessage = `食物 "${food.name}" 已成功删除！`;
				const impacts = [];

				if (response.data?.removed_from_meals) {
					impacts.push(
						`从 ${response.data.meal_count} 个餐食的 ${response.data.meal_foods_count} 条记录中移除`
					);
				}

				if (isInCart) {
					impacts.push("从当前食物篮中移除");
				}

				if (impacts.length > 0) {
					successMessage += "\n\n✅ 已同时完成：\n• " + impacts.join("\n• ");
				}

				showSuccess(successMessage);

				// 刷新用户食物列表
				handleLoadUserFoods();
			} else {
				throw new Error(response.error?.message || "删除失败");
			}
		} catch (err: unknown) {
			console.error("Failed to delete food:", err);

			// Simple error handling since cascade deletion should handle most cases
			const getErrorMessage = (error: unknown): string => {
				if (typeof error === "object" && error !== null && "message" in error) {
					return (error as { message: string }).message;
				}
				return "请稍后重试";
			};

			showError(`删除食物失败：${getErrorMessage(err)}`);
		}
	};

	const handleCameraCapture = () => {
		// 跳转到Dashboard进行拍照识别
		navigate("/dashboard");
	};

	const handleBarcodeCapture = () => {
		// 跳转到Dashboard进行条形码识别
		navigate("/dashboard?mode=barcode");
	};

	return (
		<div className="food-search">
			<div className="add-food-layout">
				{/* Left side - Meal Cart */}
				<div className="meal-cart-section">
					{/* Fixed header */}
					<div className="meal-cart-header-fixed">
						<h3>{editingMealId ? "正在编辑食物篮" : "当前食物篮"}</h3>
						<div className="meal-controls">
							<input
								type="text"
								value={mealName}
								onChange={e => setMealName(e.target.value)}
								placeholder={"输入食物篮名称 (默认: 创建时间)"}
								className="meal-name-input"
							/>
							<DateTimePicker
								value={mealTime}
								onChange={setMealTime}
								placeholder="选择餐食时间"
							/>
						</div>
					</div>

					{/* Scrollable content */}
					<div className="meal-cart-content">
						{!isAuthenticated ? (
							<div className="empty-cart">
								<p>请先登录以使用食物篮功能</p>
								<button onClick={onLoginRequired} className="btn btn-primary">
									登录
								</button>
							</div>
						) : mealCart.length === 0 ? (
							<div className="empty-cart">
								<p>食物篮为空，请从右侧添加食物</p>
							</div>
						) : (
							<div className="cart-items">
								{mealCart.map(item => (
									<div
										key={item.food.id}
										className={`cart-item ${item.updated ? "updated" : ""}`}
									>
										<div className="cart-item-info">
											<h4>
												{item.food.name}
												{item.updated && (
													<span
														className="updated-badge"
														title="营养信息已更新"
													>
														🔄
													</span>
												)}
											</h4>
											<p>
												{Math.round(
													(item.food.calories_per_100g * item.quantity) /
														100
												)}{" "}
												kcal
											</p>
											{item.updated && (
												<p className="updated-text">营养信息已更新</p>
											)}
										</div>
										<div className="cart-item-controls">
											{item.updated && (
												<button
													onClick={() => clearUpdatedStatus(item.food.id)}
													className="clear-update-btn"
													title="确认更新"
												>
													✓
												</button>
											)}
											<input
												type="number"
												value={item.quantity}
												onChange={e =>
													handleUpdateCartQuantity(
														item.food.id,
														Number(e.target.value)
													)
												}
												min="1"
												className="quantity-input-small"
											/>
											<span>g</span>
											<button
												onClick={() => handleRemoveFromCart(item.food.id)}
												className="remove-btn"
											>
												×
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Fixed footer */}
					{isAuthenticated && mealCart.length > 0 && (
						<div className="meal-cart-footer-fixed">
							<div className="cart-summary">
								{(() => {
									const totals = getTotalNutrition();
									return (
										<div className="nutrition-totals">
											<div className="total-item">
												<span className="total-label">总卡路里:</span>
												<span className="total-value">
													{Math.round(totals.calories)} kcal
												</span>
											</div>
											<div className="total-item">
												<span className="total-label">蛋白质:</span>
												<span className="total-value">
													{Math.round(totals.protein * 10) / 10}g
												</span>
											</div>
											<div className="total-item">
												<span className="total-label">脂肪:</span>
												<span className="total-value">
													{Math.round(totals.fat * 10) / 10}g
												</span>
											</div>
											<div className="total-item">
												<span className="total-label">碳水:</span>
												<span className="total-value">
													{Math.round(totals.carbs * 10) / 10}g
												</span>
											</div>
										</div>
									);
								})()}
							</div>
							<div className="cart-actions">
								<button
									onClick={handleClearCart}
									className="btn btn-danger clear-btn"
									disabled={!isAuthenticated}
								>
									清空
								</button>
								<button
									onClick={handleSaveMeal}
									className="btn btn-primary save-btn"
									disabled={!isAuthenticated || isSavingMeal}
								>
									{isSavingMeal
										? editingMealId
											? "更新中..."
											: "保存中..."
										: editingMealId
											? "更新食物篮"
											: "保存食物篮"}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Right side - Food Search */}
				<div className="food-search-section">
					<FoodSearchToolbar
						viewMode={viewMode}
						searchQuery={searchQuery}
						loading={loading}
						userFoodsLoading={userFoodsLoading}
						isAuthenticated={isAuthenticated}
						onViewModeChange={handleViewModeChange}
						onSearchQueryChange={setSearchQuery}
						onSearch={handleSearch}
						onCreateCustomFood={() => {
							resetForm();
							setShowAddFoodForm(true);
						}}
						onCameraCapture={handleCameraCapture}
						onBarcodeCapture={handleBarcodeCapture}
						onLoginRequired={onLoginRequired}
					/>

					<div className="food-results-content">
						{userFoodsLoading && (
							<div className="loading-message">
								<p>加载中...</p>
							</div>
						)}

						{!userFoodsLoading && viewMode === "user" && userFoods.length === 0 && (
							<div className="empty-message">
								<p>
									您还没有创建任何自定义食物。点击上方工具栏中的"+
									创建自定义食物"按钮创建您的第一个自定义食物！
								</p>
							</div>
						)}

						{errorMessage && (
							<div className="error-message">
								<p>{errorMessage}</p>
							</div>
						)}

						{viewMode === "search" && searchResults.length > 0 && (
							<div className="search-results">
								<h3>搜索结果</h3>
								<div className="results-grid">
									{searchResults.map((food: Food) => (
										<FoodItem
											key={food.id}
											food={food}
											onAdd={handleAddFood}
											onLoginRequired={onLoginRequired}
											onCopy={handleCopyFood}
										/>
									))}
								</div>
							</div>
						)}

						{viewMode === "user" && userFoods.length > 0 && (
							<div className="user-foods-results">
								<div className="results-grid">
									{userFoods.map((food: Food) => (
										<FoodItem
											key={food.id}
											food={food}
											onAdd={handleAddFood}
											onLoginRequired={onLoginRequired}
											onCopy={handleCopyFood}
											onEdit={handleEditFood}
											onDelete={handleDeleteFood}
											showEditActions={true}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			{showAddFoodForm && (
				<div className="modal-overlay">
					<div className="modal">
						<div className="modal-header">
							<h3>
								{editingFood && editingFood.is_custom
									? `编辑食物: ${editingFood.name}`
									: editingFood
										? `复制并编辑: ${editingFood.name}`
										: "创建自定义食物"}
							</h3>
							<button
								onClick={() => {
									setShowAddFoodForm(false);
									resetForm();
								}}
								className="close-btn"
							>
								×
							</button>
						</div>
						{errorMessage && (
							<div className="error-message">
								<p>{errorMessage}</p>
							</div>
						)}
						<form onSubmit={handleCustomFoodSubmit} className="custom-food-form">
							<div className="form-group">
								<label className="form-label">食物名称</label>
								<input
									type="text"
									value={customFood.name}
									onChange={e =>
										setCustomFood({ ...customFood, name: e.target.value })
									}
									className="form-input"
									required
									disabled={loading}
									placeholder="输入食物名称"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">🔥 卡路里 (每100g) *</label>
								<input
									type="number"
									value={customFood.calories}
									onChange={e =>
										setCustomFood({ ...customFood, calories: e.target.value })
									}
									className="form-input"
									required
									disabled={loading}
									placeholder="例如: 250"
								/>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">蛋白质 (g)</label>
									<input
										type="number"
										step="0.1"
										value={customFood.protein}
										onChange={e =>
											setCustomFood({
												...customFood,
												protein: e.target.value,
											})
										}
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
										onChange={e =>
											setCustomFood({ ...customFood, fat: e.target.value })
										}
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
										onChange={e =>
											setCustomFood({ ...customFood, carbs: e.target.value })
										}
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
										onChange={e =>
											setCustomFood({ ...customFood, fiber: e.target.value })
										}
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
										onChange={e =>
											setCustomFood({ ...customFood, sugar: e.target.value })
										}
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
										onChange={e =>
											setCustomFood({ ...customFood, sodium: e.target.value })
										}
										className="form-input"
										disabled={loading}
									/>
								</div>
							</div>

							<div className="form-actions">
								<button
									type="button"
									onClick={() => {
										setShowAddFoodForm(false);
										resetForm();
									}}
									className="btn btn-secondary"
									disabled={loading}
								>
									取消
								</button>
								<button
									type="submit"
									className="btn btn-primary"
									disabled={loading}
								>
									{loading
										? editingFood && editingFood.is_custom
											? "更新中..."
											: "创建中..."
										: editingFood && editingFood.is_custom
											? "更新"
											: "创建"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			<style>{`
				.food-search {
					max-width: 1400px;
					margin: 0 auto;
					padding: 1rem;
				}

				.add-food-layout {
					display: grid;
					grid-template-columns: 400px 1fr;
					gap: 1rem;
					height: calc(100vh - 105px);
				}

				.meal-cart-section {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.meal-cart-header-fixed {
					flex-shrink: 0;
					padding: 1.5rem 1.5rem 0;
					border-bottom: 1px solid #e9ecef;
					margin-bottom: 0;
				}

				.meal-cart-header-fixed h3 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
				}

				.meal-controls {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					margin-bottom: 1rem;
				}

				.meal-cart-content {
					flex: 1;
					overflow-y: auto;
					padding: 1.5rem;
				}

				.meal-cart-footer-fixed {
					flex-shrink: 0;
					border-top: 2px solid #e9ecef;
					background: #f8f9fa;
					padding: 1rem 1.5rem;
				}

				.meal-name-input, .meal-time-input {
					padding: 0.5rem;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 0.9rem;
				}

				.empty-cart {
					text-align: center;
					color: #6c757d;
					font-style: italic;
					margin: 2rem 0;
				}

				.cart-items {
					padding: 0;
				}

				.cart-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem;
					border: 1px solid #e9ecef;
					border-radius: 6px;
					margin-bottom: 0.5rem;
					background: #f8f9fa;
					transition: all 0.3s ease;
				}

				.cart-item.updated {
					border-color: var(--success-alt);
					background: #d4edda;
					box-shadow: var(--shadow-light);
				}

				.cart-item-info h4 {
					margin: 0 0 0.25rem 0;
					font-size: 0.9rem;
					color: #2c3e50;
				}

				.cart-item-info p {
					margin: 0;
					font-size: 0.8rem;
					color: #6c757d;
				}

				.cart-item-controls {
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.updated-badge {
					font-size: 0.8rem;
					margin-left: 0.5rem;
					animation: spin 2s linear infinite;
				}

				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				.updated-text {
					margin: 0;
					font-size: 0.75rem;
					color: #155724;
					font-style: italic;
				}

				.clear-update-btn {
					background: var(--success-alt);
					color: white;
					border: none;
					border-radius: 3px;
					width: 24px;
					height: 24px;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.8rem;
				}

				.clear-update-btn:hover {
					background: #218838;
				}

				.quantity-input-small {
					width: 70px;
					padding: 0.5rem;
					border: 2px solid #dee2e6;
					border-radius: 6px;
					text-align: center;
					font-size: 0.9rem;
					font-weight: 500;
					background: white;
					transition: all 0.3s ease;
				}

				.quantity-input-small:focus {
					outline: none;
					border-color: var(--primary-color);
					box-shadow: var(--shadow-focus);
				}

				.quantity-input-small:hover {
					border-color: #adb5bd;
				}

				.remove-btn {
					background: #dc3545;
					color: white;
					border: none;
					border-radius: 3px;
					width: 24px;
					height: 24px;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.cart-summary {
					background: white;
					padding: 1rem;
					border-radius: 6px;
					margin-bottom: 1rem;
					box-shadow: var(--shadow-light);
				}

				.nutrition-totals {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 0.5rem;
				}

				.total-item {
					display: flex;
					justify-content: space-between;
				}

				.total-label {
					font-weight: 500;
					color: #495057;
				}

				.total-value {
					font-weight: bold;
					color: var(--success-color);
				}

				.cart-actions {
					display: flex;
					gap: 0.75rem;
					margin-top: 0.5rem;
				}

				.clear-btn, .save-btn {
					flex: 1;
					padding: 0.75rem;
					border-radius: 6px;
					font-weight: 500;
					transition: all 0.3s ease;
				}

				.save-btn:disabled {
					opacity: 0.7;
					cursor: not-allowed;
					transform: none;
				}

				.food-search-section {
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.food-results-content {
					flex: 1;
					overflow-y: auto;
					padding: 1.5rem;
				}

				.loading-message, .empty-message {
					text-align: center;
					color: #6c757d;
					font-style: italic;
					margin: 2rem 0;
					padding: 2rem;
					background: #f8f9fa;
					border-radius: 8px;
				}

				.user-foods-results h3,
				.search-results h3 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 1.2rem;
					border-bottom: 2px solid #e9ecef;
					padding-bottom: 0.5rem;
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
					background: var(--bg-modal);
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
					.add-food-layout {
						grid-template-columns: 1fr;
						gap: 1rem;
						height: auto;
					}

					.meal-cart-section {
						order: 2;
						max-height: 400px;
					}

					.food-search-section {
						order: 1;
					}

					.form-row {
						grid-template-columns: 1fr;
					}

					.nutrition-totals {
						grid-template-columns: 1fr;
					}

					.cart-actions {
						flex-direction: column;
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
	onEdit?: (food: Food) => void;
	onDelete?: (food: Food) => void;
	showEditActions?: boolean;
}

const FoodItem = ({
	food,
	onAdd,
	onLoginRequired,
	onCopy,
	onEdit,
	onDelete,
	showEditActions = false,
}: FoodItemProps) => {
	const [quantity, setQuantity] = React.useState(100);
	const [showDetails, setShowDetails] = React.useState(false);
	const [nutritionData, setNutritionData] = React.useState<Food | null>(null);
	const [loadingNutrition, setLoadingNutrition] = React.useState(false);
	const { isAuthenticated } = useAuth();

	// Use nutrition data if available, otherwise use food data
	const activeFood = nutritionData || food;
	const calculatedCalories = Math.round((activeFood.calories_per_100g * quantity) / 100);
	const calculatedProtein =
		Math.round(((activeFood.protein_per_100g * quantity) / 100) * 10) / 10;
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
					fdc_id: response.data.fdc_id,
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
					<span className="calories">{activeFood.calories_per_100g || 0} kcal/100g</span>
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
						<button
							onClick={() => setShowDetails(!showDetails)}
							className="details-btn"
						>
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
						<div className="nutrition-row">
							<span>纤维: {activeFood.fiber_per_100g || 0}g</span>
							<span>糖: {activeFood.sugar_per_100g || 0}g</span>
							<span>钠: {activeFood.sodium_per_100g || 0}mg</span>
						</div>
						{food.is_usda && (
							<div className="usda-details">
								<div className="nutrition-row">
									{food.fdc_id && <span>USDA ID: {food.fdc_id}</span>}
									{food.brand && <span>品牌: {food.brand}</span>}
								</div>
								<div className="usda-info">
									<span className="info-text">✅ 来源于美国农业部营养数据库</span>
									<span className="readonly-text">
										🔒 此为USDA官方数据，无法直接编辑
									</span>
								</div>
								<div className="usda-actions">
									<small className="copy-hint">
										💡 如需修改营养信息，请点击"复制为自定义"按钮
									</small>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="add-section">
				<div className="quantity-input">
					<label>数量 (g):</label>
					<input
						type="number"
						value={quantity}
						onChange={e => setQuantity(Number(e.target.value))}
						min="1"
						className="quantity-field"
					/>
				</div>

				<div className="calculated-nutrition">
					<div className="calc-item">
						<span className="calc-value">{calculatedCalories}</span>
						<span className="calc-label">kcal</span>
					</div>
					<div className="calc-details">
						蛋白质: {calculatedProtein}g | 脂肪: {calculatedFat}g | 碳水:{" "}
						{calculatedCarbs}g
					</div>
				</div>

				<div className="food-actions">
					<button
						onClick={() =>
							isAuthenticated ? onAdd(food, quantity) : onLoginRequired()
						}
						className="btn btn-primary add-btn"
					>
						添加
					</button>
					{showEditActions ? (
						<>
							{food.is_usda ? (
								<>
									{/* USDA foods are read-only, only allow copying */}
									<button
										onClick={() =>
											isAuthenticated ? onCopy(food) : onLoginRequired()
										}
										className="btn btn-info copy-btn"
										title="复制为自定义食物"
									>
										📋 复制为自定义
									</button>
									<span
										className="readonly-badge"
										title="USDA食物为只读，不可编辑"
									>
										🔒 只读
									</span>
								</>
							) : (
								<>
									{/* Custom foods can be edited and deleted */}
									<button
										onClick={() => onEdit && onEdit(food)}
										className="btn btn-warning edit-btn"
										title="编辑食物"
									>
										✏️ 编辑
									</button>
									<button
										onClick={() => onDelete && onDelete(food)}
										className="btn btn-danger delete-btn"
										title="删除食物"
									>
										🗑️ 删除
									</button>
								</>
							)}
						</>
					) : (
						<button
							onClick={() => (isAuthenticated ? onCopy(food) : onLoginRequired())}
							className="btn btn-secondary copy-btn"
							title="复制为自定义食物"
						>
							复制
						</button>
					)}
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
					box-shadow: var(--shadow-notification);
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
					background: var(--success-alt);
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

				.readonly-badge {
					background: #f8f9fa;
					color: #6c757d;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.75rem;
					border: 1px solid #dee2e6;
					display: inline-flex;
					align-items: center;
					gap: 0.25rem;
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
					background: var(--success-alt);
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
					color: var(--primary-color);
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

				.usda-details {
					margin-top: 0.5rem;
					padding-top: 0.5rem;
					border-top: 1px solid #e9ecef;
				}

				.usda-info {
					margin-top: 0.25rem;
				}

				.info-text {
					font-size: 0.8rem;
					color: var(--success-alt);
					font-style: italic;
					display: block;
					margin-bottom: 0.25rem;
				}

				.readonly-text {
					font-size: 0.75rem;
					color: #dc3545;
					font-weight: 500;
					display: block;
				}

				.usda-actions {
					margin-top: 0.5rem;
					padding-top: 0.5rem;
					border-top: 1px solid #dee2e6;
				}

				.copy-hint {
					font-size: 0.75rem;
					color: #6c757d;
					font-style: italic;
					display: block;
				}

				.add-section {
					border-top: 1px solid #e9ecef;
					padding-top: 1rem;
					margin-top: 1rem;
				}

				.quantity-input {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					margin-bottom: 0.75rem;
					padding: 0.75rem;
					background: #f8f9fa;
					border-radius: 8px;
					border: 1px solid #e9ecef;
				}

				.quantity-input label {
					font-weight: 500;
					color: #495057;
					white-space: nowrap;
				}

				.quantity-field {
					width: 100px;
					padding: 0.5rem 0.75rem;
					border: 2px solid #dee2e6;
					border-radius: 6px;
					font-size: 1rem;
					font-weight: 500;
					text-align: center;
					background: white;
					transition: all 0.3s ease;
				}

				.quantity-field:focus {
					outline: none;
					border-color: var(--primary-color);
					box-shadow: var(--shadow-focus);
				}

				.quantity-field:hover {
					border-color: #adb5bd;
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
					color: var(--success-color);
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

				.edit-btn {
					flex: 1;
					padding: 0.75rem;
					background-color: #ffc107;
					border-color: #ffc107;
					color: #212529;
				}

				.edit-btn:hover {
					background-color: #e0a800;
					border-color: #d39e00;
				}

				.delete-btn {
					flex: 1;
					padding: 0.75rem;
					background-color: #dc3545;
					border-color: #dc3545;
					color: white;
				}

				.delete-btn:hover {
					background-color: #c82333;
					border-color: #bd2130;
				}
			`}</style>
		</div>
	);
};
export default FoodSearch;
