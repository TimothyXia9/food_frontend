import React, { useState } from "react";
import {
	authService,
	userService,
	foodService,
	mealService,
	statisticsService,
	imageService,
	LoginRequest,
	RegisterRequest,
} from "../services";
import { useAuth } from "../contexts/AuthContext";

interface ApiTestProps {
	onLoginRequired: () => void;
}

const ApiTest = ({ onLoginRequired }: ApiTestProps) => {
	const { isAuthenticated } = useAuth();
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const addResult = (testName: string, success: boolean, data: any, error?: any) => {
		const result = {
			id: Date.now(),
			testName,
			success,
			data: success ? data : null,
			error: success ? null : error?.message || error,
			timestamp: new Date().toLocaleTimeString(),
		};
		setResults(prev => [result, ...prev]);
	};

	const runTest = async (testName: string, testFn: () => Promise<any>) => {
		setLoading(true);
		try {
			const result = await testFn();
			addResult(testName, true, result);
		} catch (error) {
			addResult(testName, false, null, error);
		} finally {
			setLoading(false);
		}
	};

	const clearResults = () => {
		setResults([]);
	};

	// Authentication Tests
	const testRegister = () => {
		const registerData: RegisterRequest = {
			username: `testuser_${Date.now()}`,
			email: `test_${Date.now()}@example.com`,
			password: "password123",
			nickname: "Test User",
		};
		return runTest("用户注册", () => authService.register(registerData));
	};

	const testLogin = () => {
		const loginData: LoginRequest = {
			username: "testuser",
			password: "password123",
		};
		return runTest("用户登录", () => authService.login(loginData));
	};

	const testRefreshToken = () => {
		return runTest("刷新令牌", () => authService.refreshToken());
	};

	const testLogout = () => {
		return runTest("用户登出", () => authService.logout());
	};

	// User Service Tests
	const testGetProfile = () => {
		return runTest("获取用户资料", () => userService.getProfile());
	};

	const testUpdateProfile = () => {
		const profileData = {
			nickname: "Updated Test User",
			height: 175,
			weight: 70,
			daily_calorie_goal: 2000,
		};
		return runTest("更新用户资料", () => userService.updateProfile(profileData));
	};

	// Food Service Tests
	const testSearchFoods = () => {
		return runTest("搜索食物 (GET /foods/search/)", () =>
			foodService.searchFoods({ query: "apple", page_size: 10 })
		);
	};

	const testGetFoodDetails = () => {
		return runTest("获取食物详情 (GET /foods/{id}/)", () => foodService.getFoodDetails(1));
	};

	const testCreateCustomFood = () => {
		const foodData = {
			name: `Test Food ${Date.now()}`,
			brand: "Test Brand",
			serving_size: 100,
			calories_per_100g: 150,
			protein_per_100g: 10,
			fat_per_100g: 5,
			carbs_per_100g: 20,
			fiber_per_100g: 3,
			sugar_per_100g: 2,
			sodium_per_100g: 100,
		};
		return runTest("创建自定义食物 (POST /foods/create/)", () =>
			foodService.createCustomFood(foodData)
		);
	};

	// USDA API Tests
	const testSearchUSDAFoods = () => {
		return runTest("搜索USDA食物 (GET /foods/usda/search/)", async () => {
			const response = await fetch(
				"http://localhost:8000/api/v1/foods/usda/search/?query=apple&page_size=5",
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${authService.getCurrentToken()}`,
						"Content-Type": "application/json",
					},
				}
			);
			return response.json();
		});
	};

	const testGetUSDANutrition = () => {
		return runTest("获取USDA营养信息 (GET /foods/usda/nutrition/{fdc_id}/)", async () => {
			const response = await fetch(
				"http://localhost:8000/api/v1/foods/usda/nutrition/1102702/",
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			return response.json();
		});
	};

	const testCreateFoodFromUSDA = () => {
		return runTest("从USDA创建食物 (POST /foods/usda/create/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/foods/usda/create/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fdc_id: "1102702",
					custom_name: "Test Apple from USDA",
				}),
			});
			return response.json();
		});
	};

	const testGetSearchHistory = () => {
		return runTest("获取搜索历史 (GET /foods/search/history/)", () =>
			foodService.getSearchHistory(10)
		);
	};

	// Meal Service Tests
	const testGetMealsByDate = () => {
		return runTest("获取用户餐食 (GET /meals/list/)", () =>
			mealService.getUserMeals({ date: "2024-01-15" })
		);
	};

	const testCreateMeal = () => {
		const mealData = {
			date: "2024-01-15",
			meal_type: "breakfast" as const,
			name: "Test Breakfast",
			notes: "Test meal",
			foods: [{ food_id: 1, quantity: 150 }],
		};
		return runTest("创建餐食 (POST /meals/create/)", () => mealService.createMeal(mealData));
	};

	const testGetMealDetails = () => {
		return runTest("获取餐食详情 (GET /meals/{id}/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/meals/1/", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
			});
			return response.json();
		});
	};

	const testGetRecentMeals = () => {
		return runTest("获取最近餐食 (GET /meals/recent/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/meals/recent/?limit=5", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
			});
			return response.json();
		});
	};

	const testAddFoodToMeal = () => {
		return runTest("添加食物到餐食 (POST /meals/{id}/add-food/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/meals/1/add-food/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					food_id: 2,
					quantity: 100,
				}),
			});
			return response.json();
		});
	};

	const testCreateMealPlan = () => {
		return runTest("创建餐食计划 (POST /meals/plan/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/meals/plan/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					start_date: "2024-01-15",
					end_date: "2024-01-21",
					meal_template: {
						breakfast: [{ food_id: 1, quantity: 150 }],
						lunch: [{ food_id: 2, quantity: 200 }],
						dinner: [{ food_id: 3, quantity: 180 }],
					},
				}),
			});
			return response.json();
		});
	};

	// Statistics Service Tests
	const testGetDailySummary = () => {
		return runTest("获取每日汇总 (GET /meals/daily-summary/)", () =>
			statisticsService.getDailySummary({ date: "2024-01-15" })
		);
	};

	const testGetNutritionStats = () => {
		return runTest("获取营养统计 (GET /meals/nutrition-stats/)", () =>
			statisticsService.getNutritionStats({ start_date: "2024-01-15", period: "weekly" })
		);
	};

	const testRecordWeight = () => {
		const weightData = {
			date: "2024-01-15",
			weight: 70.5,
			notes: "Morning weight",
		};
		return runTest("记录体重 (POST /meals/record-weight/)", () =>
			statisticsService.recordWeight(weightData)
		);
	};

	// Image Service Tests
	const testUploadImage = () => {
		return runTest("上传图片 (POST /images/upload/)", async () => {
			// Create a mock image file
			const canvas = document.createElement("canvas");
			canvas.width = 100;
			canvas.height = 100;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(0, 0, 100, 100);
			}

			return new Promise(resolve => {
				canvas.toBlob(blob => {
					if (blob) {
						const formData = new FormData();
						formData.append("image", blob, "test-image.jpg");
						formData.append("notes", "Test image upload");

						fetch("http://localhost:8000/api/v1/images/upload/", {
							method: "POST",
							headers: {
								Authorization: `Bearer ${authService.getCurrentToken()}`,
							},
							body: formData,
						})
							.then(response => response.json())
							.then(resolve)
							.catch(resolve);
					} else {
						resolve({ error: "Failed to create blob" });
					}
				}, "image/jpeg");
			});
		});
	};

	const testAnalyzeImage = () => {
		return runTest("分析图片 (POST /images/analyze/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/images/analyze/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					image_id: 1,
					analysis_type: "full",
				}),
			});
			return response.json();
		});
	};

	const testGetImageResults = () => {
		return runTest("获取图片分析结果 (GET /images/{id}/results/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/images/1/results/", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
			});
			return response.json();
		});
	};

	const testGetUserImages = () => {
		return runTest("获取用户图片 (GET /images/list/)", async () => {
			const response = await fetch(
				"http://localhost:8000/api/v1/images/list/?page=1&page_size=10",
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${authService.getCurrentToken()}`,
						"Content-Type": "application/json",
					},
				}
			);
			return response.json();
		});
	};

	const testConfirmFoodRecognition = () => {
		return runTest("确认食物识别 (POST /images/confirm/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/images/confirm/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					result_id: 1,
					is_confirmed: true,
					corrections: [],
				}),
			});
			return response.json();
		});
	};

	const testCreateMealFromImage = () => {
		return runTest("从图片创建餐食 (POST /images/create-meal/)", async () => {
			const response = await fetch("http://localhost:8000/api/v1/images/create-meal/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${authService.getCurrentToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					image_id: 1,
					meal_type: "breakfast",
					date: "2024-01-15",
					meal_name: "Test Breakfast from Image",
				}),
			});
			return response.json();
		});
	};

	// Auth Status Tests
	const testAuthStatus = () => {
		const isAuthenticated = authService.isAuthenticated();
		const token = authService.getCurrentToken();
		addResult("检查认证状态", true, { isAuthenticated, hasToken: !!token });
	};

	return (
		<div className="api-test">
			<div className="test-header">
				<h1>API 服务测试</h1>
				<div className="test-controls">
					{!isAuthenticated && (
						<button onClick={onLoginRequired} className="btn btn-primary">
							登录以测试API
						</button>
					)}
					<button onClick={clearResults} className="btn btn-secondary">
						清空结果
					</button>
					<span className="test-count">测试结果: {results.length}</span>
				</div>
			</div>

			<div className="test-sections">
				{/* Authentication Tests */}
				<div className="test-section">
					<h3>认证服务 (Authentication)</h3>
					<div className="test-buttons">
						<button
							onClick={testAuthStatus}
							className="btn btn-info"
							disabled={loading}
						>
							检查认证状态
						</button>
						<button
							onClick={testRegister}
							className="btn btn-primary"
							disabled={loading}
						>
							测试注册
						</button>
						<button onClick={testLogin} className="btn btn-primary" disabled={loading}>
							测试登录
						</button>
						<button
							onClick={testRefreshToken}
							className="btn btn-warning"
							disabled={loading}
						>
							刷新令牌
						</button>
						<button onClick={testLogout} className="btn btn-danger" disabled={loading}>
							测试登出
						</button>
					</div>
				</div>

				{/* User Service Tests */}
				<div className="test-section">
					<h3>用户服务 (User Service)</h3>
					<div className="test-buttons">
						<button
							onClick={testGetProfile}
							className="btn btn-primary"
							disabled={loading}
						>
							获取用户资料
						</button>
						<button
							onClick={testUpdateProfile}
							className="btn btn-primary"
							disabled={loading}
						>
							更新用户资料
						</button>
					</div>
				</div>

				{/* Food Service Tests */}
				<div className="test-section">
					<h3>食物服务 (Food Service)</h3>
					<div className="test-buttons">
						<button
							onClick={testSearchFoods}
							className="btn btn-primary"
							disabled={loading}
						>
							搜索食物
						</button>
						<button
							onClick={testGetFoodDetails}
							className="btn btn-primary"
							disabled={loading}
						>
							获取食物详情
						</button>
						<button
							onClick={testCreateCustomFood}
							className="btn btn-success"
							disabled={loading}
						>
							创建自定义食物
						</button>
						<button
							onClick={testGetSearchHistory}
							className="btn btn-info"
							disabled={loading}
						>
							获取搜索历史
						</button>
					</div>
				</div>

				{/* USDA Integration Tests */}
				<div className="test-section">
					<h3>USDA集成服务 (USDA Integration)</h3>
					<div className="test-buttons">
						<button
							onClick={testSearchUSDAFoods}
							className="btn btn-primary"
							disabled={loading}
						>
							搜索USDA食物
						</button>
						<button
							onClick={testGetUSDANutrition}
							className="btn btn-primary"
							disabled={loading}
						>
							获取USDA营养信息
						</button>
						<button
							onClick={testCreateFoodFromUSDA}
							className="btn btn-success"
							disabled={loading}
						>
							从USDA创建食物
						</button>
					</div>
				</div>

				{/* Meal Service Tests */}
				<div className="test-section">
					<h3>餐食服务 (Meal Service)</h3>
					<div className="test-buttons">
						<button
							onClick={testGetMealsByDate}
							className="btn btn-primary"
							disabled={loading}
						>
							获取日期餐食
						</button>
						<button
							onClick={testCreateMeal}
							className="btn btn-success"
							disabled={loading}
						>
							创建餐食
						</button>
						<button
							onClick={testGetMealDetails}
							className="btn btn-primary"
							disabled={loading}
						>
							获取餐食详情
						</button>
						<button
							onClick={testGetRecentMeals}
							className="btn btn-info"
							disabled={loading}
						>
							获取最近餐食
						</button>
						<button
							onClick={testAddFoodToMeal}
							className="btn btn-warning"
							disabled={loading}
						>
							添加食物到餐食
						</button>
						<button
							onClick={testCreateMealPlan}
							className="btn btn-success"
							disabled={loading}
						>
							创建餐食计划
						</button>
					</div>
				</div>

				{/* Statistics Service Tests */}
				<div className="test-section">
					<h3>统计服务 (Statistics Service)</h3>
					<div className="test-buttons">
						<button
							onClick={testGetDailySummary}
							className="btn btn-primary"
							disabled={loading}
						>
							获取每日汇总
						</button>
						<button
							onClick={testGetNutritionStats}
							className="btn btn-primary"
							disabled={loading}
						>
							获取营养统计
						</button>
						<button
							onClick={testRecordWeight}
							className="btn btn-success"
							disabled={loading}
						>
							记录体重
						</button>
					</div>
				</div>

				{/* Image Service Tests */}
				<div className="test-section">
					<h3>图片服务 (Image Service)</h3>
					<div className="test-buttons">
						<button
							onClick={testUploadImage}
							className="btn btn-primary"
							disabled={loading}
						>
							上传图片
						</button>
						<button
							onClick={testAnalyzeImage}
							className="btn btn-warning"
							disabled={loading}
						>
							分析图片
						</button>
						<button
							onClick={testGetImageResults}
							className="btn btn-info"
							disabled={loading}
						>
							获取图片分析结果
						</button>
						<button
							onClick={testGetUserImages}
							className="btn btn-primary"
							disabled={loading}
						>
							获取用户图片
						</button>
						<button
							onClick={testConfirmFoodRecognition}
							className="btn btn-success"
							disabled={loading}
						>
							确认食物识别
						</button>
						<button
							onClick={testCreateMealFromImage}
							className="btn btn-success"
							disabled={loading}
						>
							从图片创建餐食
						</button>
					</div>
				</div>
			</div>

			{/* Test Results */}
			<div className="test-results">
				<h3>测试结果</h3>
				{loading && <div className="loading">测试中...</div>}
				<div className="results-list">
					{results.map(result => (
						<div
							key={result.id}
							className={`result-item ${result.success ? "success" : "error"}`}
						>
							<div className="result-header">
								<span className="result-name">{result.testName}</span>
								<span className="result-status">
									{result.success ? "✅ 成功" : "❌ 失败"}
								</span>
								<span className="result-time">{result.timestamp}</span>
							</div>
							<div className="result-content">
								{result.success ? (
									<pre className="result-data">
										{JSON.stringify(result.data, null, 2)}
									</pre>
								) : (
									<pre className="result-error">{result.error}</pre>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			<style>{`
				.api-test {
					max-width: 1200px;
					margin: 0 auto;
					padding: 1rem;
				}

				.test-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 2rem;
					padding-bottom: 1rem;
					border-bottom: 2px solid #e0e0e0;
				}

				.test-controls {
					display: flex;
					align-items: center;
					gap: 1rem;
				}

				.test-count {
					font-weight: 500;
					color: #666;
				}

				.test-sections {
					margin-bottom: 2rem;
				}

				.test-section {
					margin-bottom: 1.5rem;
					padding: 1rem;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					background: #f9f9f9;
				}

				.test-section h3 {
					margin: 0 0 1rem 0;
					color: #333;
				}

				.test-buttons {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
				}

				.btn {
					padding: 0.5rem 1rem;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 0.9rem;
					transition: all 0.2s;
				}

				.btn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.btn-primary {
					background: #007bff;
					color: white;
				}

				.btn-success {
					background: #28a745;
					color: white;
				}

				.btn-warning {
					background: #ffc107;
					color: #212529;
				}

				.btn-danger {
					background: #dc3545;
					color: white;
				}

				.btn-info {
					background: #17a2b8;
					color: white;
				}

				.btn-secondary {
					background: #6c757d;
					color: white;
				}

				.btn:hover:not(:disabled) {
					transform: translateY(-1px);
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}

				.test-results {
					border-top: 2px solid #e0e0e0;
					padding-top: 1rem;
				}

				.loading {
					text-align: center;
					color: #007bff;
					font-weight: 500;
					margin: 1rem 0;
				}

				.results-list {
					max-height: 600px;
					overflow-y: auto;
				}

				.result-item {
					margin-bottom: 1rem;
					border-radius: 8px;
					overflow: hidden;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}

				.result-item.success {
					border-left: 4px solid #28a745;
				}

				.result-item.error {
					border-left: 4px solid #dc3545;
				}

				.result-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem 1rem;
					background: #f8f9fa;
					border-bottom: 1px solid #e0e0e0;
				}

				.result-name {
					font-weight: 600;
					color: #333;
				}

				.result-status {
					font-size: 0.9rem;
				}

				.result-time {
					font-size: 0.8rem;
					color: #666;
				}

				.result-content {
					padding: 1rem;
					background: white;
				}

				.result-data, .result-error {
					margin: 0;
					padding: 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					overflow-x: auto;
				}

				.result-data {
					background: #f8f9fa;
					border: 1px solid #e0e0e0;
				}

				.result-error {
					background: #f8d7da;
					border: 1px solid #f5c6cb;
					color: #721c24;
				}

				@media (max-width: 768px) {
					.test-header {
						flex-direction: column;
						gap: 1rem;
						align-items: flex-start;
					}

					.test-buttons {
						justify-content: flex-start;
					}

					.result-header {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}
				}
			`}</style>
		</div>
	);
};

export default ApiTest;
