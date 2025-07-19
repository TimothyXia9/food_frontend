import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentLocalDate } from "../utils/timezone";

interface DashboardProps {
	onLoginRequired: () => void;
}

const Dashboard = ({ onLoginRequired }: DashboardProps) => {
	const { isAuthenticated } = useAuth();
	const todayDate = new Date(getCurrentLocalDate()).toLocaleDateString("zh-CN");

	// 模拟数据
	const dailyStats = {
		caloriesConsumed: 1450,
		calorieGoal: 2000,
		protein: 85,
		fat: 45,
		carbs: 180,
		fiber: 25,
	};
	const recentMeals = [
		{
			id: 1,
			type: "早餐",
			time: "08:30",
			items: ["燕麦粥", "香蕉", "牛奶"],
			calories: 320,
		},
		{
			id: 2,
			type: "午餐",
			time: "12:45",
			items: ["鸡胸肉沙拉", "全麦面包"],
			calories: 480,
		},
		{
			id: 3,
			type: "晚餐",
			time: "18:20",
			items: ["蒸蛋", "青菜", "米饭"],
			calories: 650,
		},
	];
	const calorieProgress = (dailyStats.caloriesConsumed / dailyStats.calorieGoal) * 100;
	const remainingCalories = dailyStats.calorieGoal - dailyStats.caloriesConsumed;

	if (!isAuthenticated) {
		return (
			<div className="dashboard">
				<div className="not-authenticated">
					<h2>我的首页</h2>
					<p>请先登录以查看您的个人数据和饮食统计</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						登录
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<h1>今日概览</h1>
				<p className="date">{todayDate}</p>
			</div>
			<div className="dashboard-grid">
				{/* 卡路里概览卡片 */}
				<div className="card calorie-overview">
					<div className="card-header">
						<h3 className="card-title">卡路里摄入</h3>
					</div>
					<div className="calorie-progress">
						<div className="progress-circle">
							<div className="progress-text">
								<span className="consumed">{dailyStats.caloriesConsumed}</span>
								<span className="goal">/ {dailyStats.calorieGoal}</span>
							</div>
						</div>
						<div className="progress-bar">
							<div className="progress-fill" style={{ width: `${Math.min(calorieProgress, 100)}%` }}></div>
						</div>
					</div>
					<div className="calorie-stats">
						<div className="stat-item">
							<span className="stat-label">剩余</span>
							<span className={`stat-value ${remainingCalories < 0 ? "negative" : ""}`}>{remainingCalories > 0 ? remainingCalories : Math.abs(remainingCalories)} kcal</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">进度</span>
							<span className="stat-value">{calorieProgress.toFixed(1)}%</span>
						</div>
					</div>
				</div>
				{/* 营养素分布 */}
				<div className="card nutrition-card">
					<div className="card-header">
						<h3 className="card-title">营养素分布</h3>
					</div>
					<div className="nutrition-grid">
						<div className="nutrition-item">
							<div className="nutrition-icon">🥩</div>
							<div className="nutrition-info">
								<span className="nutrition-label">蛋白质</span>
								<span className="nutrition-value">{dailyStats.protein}g</span>
							</div>
						</div>
						<div className="nutrition-item">
							<div className="nutrition-icon">🥑</div>
							<div className="nutrition-info">
								<span className="nutrition-label">脂肪</span>
								<span className="nutrition-value">{dailyStats.fat}g</span>
							</div>
						</div>
						<div className="nutrition-item">
							<div className="nutrition-icon">🍞</div>
							<div className="nutrition-info">
								<span className="nutrition-label">碳水化合物</span>
								<span className="nutrition-value">{dailyStats.carbs}g</span>
							</div>
						</div>
						<div className="nutrition-item">
							<div className="nutrition-icon">🌾</div>
							<div className="nutrition-info">
								<span className="nutrition-label">纤维</span>
								<span className="nutrition-value">{dailyStats.fiber}g</span>
							</div>
						</div>
					</div>
				</div>
				{/* 今日餐食 */}
				<div className="card meals-card">
					<div className="card-header">
						<h3 className="card-title">今日餐食</h3>
						<button
							className="btn btn-primary"
							onClick={() => isAuthenticated ? console.log("Add meal") : onLoginRequired()}
						>
							+ 添加食物篮
						</button>
					</div>
					<div className="meals-list">
						{recentMeals.map((meal) => (
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
				{/* 快捷操作 */}
				<div className="card quick-actions">
					<div className="card-header">
						<h3 className="card-title">快捷操作</h3>
					</div>
					<div className="action-grid">
						<button
							className="action-btn"
							onClick={() => isAuthenticated ? console.log("Camera") : onLoginRequired()}
						>
							<div className="action-icon">📸</div>
							<span>拍照记录</span>
						</button>
						<button
							className="action-btn"
							onClick={() => isAuthenticated ? console.log("Search") : onLoginRequired()}
						>
							<div className="action-icon">🔍</div>
							<span>搜索食物</span>
						</button>
						<button
							className="action-btn"
							onClick={() => isAuthenticated ? console.log("Weight") : onLoginRequired()}
						>
							<div className="action-icon">⚖️</div>
							<span>记录体重</span>
						</button>
						<button className="action-btn">
							<div className="action-icon">📊</div>
							<span>查看统计</span>
						</button>
					</div>
				</div>
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
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 1.5rem;
				}

				.calorie-overview {
					grid-column: span 2;
				}

				.progress-circle {
					text-align: center;
					margin-bottom: 1rem;
				}

				.progress-text .consumed {
					font-size: 2rem;
					font-weight: bold;
					color: #3498db;
				}

				.progress-text .goal {
					font-size: 1.2rem;
					color: #7f8c8d;
				}

				.progress-bar {
					width: 100%;
					height: 8px;
					background: #ecf0f1;
					border-radius: 4px;
					overflow: hidden;
					margin-bottom: 1rem;
				}

				.progress-fill {
					height: 100%;
					background: linear-gradient(90deg, #3498db, #2ecc71);
					transition: width 0.3s ease;
				}

				.calorie-stats {
					display: flex;
					justify-content: space-around;
				}

				.stat-item {
					text-align: center;
				}

				.stat-label {
					display: block;
					font-size: 0.9rem;
					color: #7f8c8d;
					margin-bottom: 0.25rem;
				}

				.stat-value {
					font-size: 1.1rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.stat-value.negative {
					color: #e74c3c;
				}

				.nutrition-grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 1rem;
				}

				.nutrition-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
				}

				.nutrition-icon {
					font-size: 1.5rem;
				}

				.nutrition-info {
					display: flex;
					flex-direction: column;
				}

				.nutrition-label {
					font-size: 0.9rem;
					color: #7f8c8d;
				}

				.nutrition-value {
					font-size: 1.1rem;
					font-weight: bold;
					color: #2c3e50;
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
					color: #3498db;
				}

				.calories-unit {
					font-size: 0.8rem;
					color: #7f8c8d;
				}

				.action-grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 1rem;
				}

				.action-btn {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.5rem;
					padding: 1rem;
					background: #f8f9fa;
					border: 1px solid #e9ecef;
					border-radius: 6px;
					cursor: pointer;
					transition: all 0.3s;
				}

				.action-btn:hover {
					background: #e9ecef;
					border-color: #3498db;
				}

				.action-icon {
					font-size: 1.5rem;
				}

				.not-authenticated {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

				@media (max-width: 768px) {
					.dashboard-grid {
						grid-template-columns: 1fr;
					}

					.calorie-overview {
						grid-column: span 1;
					}
				}
			`}</style>
		</div>
	);
};
export default Dashboard;
