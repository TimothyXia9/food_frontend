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
				<h1>今日餐食</h1>
				<p className="date">{todayDate}</p>
			</div>
			<div className="dashboard-grid">
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
					color: #3498db;
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
			`}</style>
		</div>
	);
};
export default Dashboard;
