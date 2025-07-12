import React from "react";
const Statistics = () => {
	const [selectedPeriod, setSelectedPeriod] = React.useState<"week" | "month" | "year">("week");
	const [currentDate, setCurrentDate] = React.useState(new Date());
	const weeklyData = [
		{ date: "2024-01-15", calories: 1800, weight: 70.5, goal: 2000 },
		{ date: "2024-01-16", calories: 2100, weight: 70.3, goal: 2000 },
		{ date: "2024-01-17", calories: 1950, weight: 70.1, goal: 2000 },
		{ date: "2024-01-18", calories: 1750, weight: 69.9, goal: 2000 },
		{ date: "2024-01-19", calories: 2200, weight: 70.0, goal: 2000 },
		{ date: "2024-01-20", calories: 1900, weight: 69.8, goal: 2000 },
		{ date: "2024-01-21", calories: 2050, weight: 69.6, goal: 2000 },
	];
	const nutritionTrends = {
		protein: { current: 85, previous: 78, trend: "up" },
		fat: { current: 65, previous: 70, trend: "down" },
		carbs: { current: 180, previous: 190, trend: "down" },
		fiber: { current: 25, previous: 22, trend: "up" },
	};
	const achievements = [
		{ id: 1, title: "连续记录7天", description: "坚持记录饮食7天", achieved: true, icon: "🏆" },
		{ id: 2, title: "达到卡路里目标", description: "单日卡路里摄入达标", achieved: true, icon: "🎯" },
		{ id: 3, title: "蛋白质达标", description: "单日蛋白质摄入达标", achieved: true, icon: "💪" },
		{ id: 4, title: "体重下降", description: "相比上周体重下降", achieved: true, icon: "📉" },
		{ id: 5, title: "连续记录30天", description: "坚持记录饮食30天", achieved: false, icon: "🔥" },
		{ id: 6, title: "完美一周", description: "一周内每天都达到目标", achieved: false, icon: "⭐" },
	];
	const getDateRange = () => {
		const formatDate = (date: Date) => {
			return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
		};
		if (selectedPeriod === "week") {
			const startDate = new Date(currentDate);
			startDate.setDate(currentDate.getDate() - 6);
			return `${formatDate(startDate)} - ${formatDate(currentDate)}`;
		} else if (selectedPeriod === "month") {
			return currentDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
		} else {
			return currentDate.getFullYear().toString();
		}
	};
	const calculateStats = () => {
		const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
		const avgCalories = Math.round(totalCalories / weeklyData.length);
		const avgWeight = Math.round((weeklyData.reduce((sum, day) => sum + day.weight, 0) / weeklyData.length) * 10) / 10;
		const daysOnTarget = weeklyData.filter((day) => day.calories >= day.goal * 0.9 && day.calories <= day.goal * 1.1).length;
		const weightChange = Math.round((weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) * 10) / 10;

		return {
			avgCalories,
			avgWeight,
			daysOnTarget,
			weightChange,
		};
	};
	const stats = calculateStats();
	const navigateDate = (direction: "prev" | "next") => {
		const newDate = new Date(currentDate);
		if (selectedPeriod === "week") {
			newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
		} else if (selectedPeriod === "month") {
			newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
		} else {
			newDate.setFullYear(currentDate.getFullYear() + (direction === "next" ? 1 : -1));
		}
		setCurrentDate(newDate);
	};
	return (
		<div className="statistics">
			<div className="stats-header">
				<h1>数据统计</h1>

				<div className="period-selector">
					<button className={`period-btn ${selectedPeriod === "week" ? "active" : ""}`} onClick={() => setSelectedPeriod("week")}>
						周
					</button>
					<button className={`period-btn ${selectedPeriod === "month" ? "active" : ""}`} onClick={() => setSelectedPeriod("month")}>
						月
					</button>
					<button className={`period-btn ${selectedPeriod === "year" ? "active" : ""}`} onClick={() => setSelectedPeriod("year")}>
						年
					</button>
				</div>
			</div>
			<div className="date-navigation">
				<button onClick={() => navigateDate("prev")} className="nav-btn">
					← 上一{selectedPeriod === "week" ? "周" : selectedPeriod === "month" ? "月" : "年"}
				</button>
				<h2 className="current-period">{getDateRange()}</h2>
				<button onClick={() => navigateDate("next")} className="nav-btn">
					下一{selectedPeriod === "week" ? "周" : selectedPeriod === "month" ? "月" : "年"} →
				</button>
			</div>
			<div className="stats-grid">
				{/* 概览统计 */}
				<div className="card overview-stats">
					<div className="card-header">
						<h3 className="card-title">本周概览</h3>
					</div>

					<div className="overview-grid">
						<div className="overview-item">
							<div className="overview-icon">🍽️</div>
							<div className="overview-info">
								<span className="overview-value">{stats.avgCalories}</span>
								<span className="overview-label">平均卡路里</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">⚖️</div>
							<div className="overview-info">
								<span className="overview-value">{stats.avgWeight}</span>
								<span className="overview-label">平均体重 (kg)</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">🎯</div>
							<div className="overview-info">
								<span className="overview-value">{stats.daysOnTarget}</span>
								<span className="overview-label">达标天数</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">📈</div>
							<div className="overview-info">
								<span className={`overview-value ${stats.weightChange < 0 ? "negative" : "positive"}`}>
									{stats.weightChange > 0 ? "+" : ""}
									{stats.weightChange}
								</span>
								<span className="overview-label">体重变化 (kg)</span>
							</div>
						</div>
					</div>
				</div>
				{/* 卡路里趋势图 */}
				<div className="card chart-card">
					<div className="card-header">
						<h3 className="card-title">卡路里趋势</h3>
					</div>

					<div className="chart-container">
						<div className="chart-placeholder">
							<div className="chart-bars">
								{weeklyData.map((day, index) => {
									const height = (day.calories / 2500) * 100;
									const isAboveGoal = day.calories > day.goal;
									return (
										<div key={index} className="chart-bar-container">
											<div className={`chart-bar ${isAboveGoal ? "above-goal" : "below-goal"}`} style={{ height: `${height}%` }} title={`${day.calories} kcal`}></div>
											<div className="chart-label">{new Date(day.date).toLocaleDateString("zh-CN", { weekday: "short" })}</div>
										</div>
									);
								})}
							</div>
							<div className="chart-legend">
								<div className="legend-item">
									<div className="legend-color below-goal"></div>
									<span>未达目标</span>
								</div>
								<div className="legend-item">
									<div className="legend-color above-goal"></div>
									<span>超过目标</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* 营养素趋势 */}
				<div className="card nutrition-trends">
					<div className="card-header">
						<h3 className="card-title">营养素趋势</h3>
					</div>

					<div className="nutrition-trends-grid">
						{Object.entries(nutritionTrends).map(([key, data]) => {
							const labels: Record<string, string> = {
								protein: "蛋白质",
								fat: "脂肪",
								carbs: "碳水化合物",
								fiber: "纤维",
							};

							return (
								<div key={key} className="trend-item">
									<div className="trend-header">
										<span className="trend-label">{labels[key]}</span>
										<span className={`trend-indicator ${data.trend}`}>{data.trend === "up" ? "↗️" : "↘️"}</span>
									</div>
									<div className="trend-values">
										<span className="trend-current">{data.current}g</span>
										<span className="trend-previous">vs {data.previous}g</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
				{/* 成就系统 */}
				<div className="card achievements">
					<div className="card-header">
						<h3 className="card-title">成就徽章</h3>
					</div>

					<div className="achievements-grid">
						{achievements.map((achievement) => (
							<div key={achievement.id} className={`achievement-item ${achievement.achieved ? "achieved" : "locked"}`}>
								<div className="achievement-icon">{achievement.icon}</div>
								<div className="achievement-info">
									<h4 className="achievement-title">{achievement.title}</h4>
									<p className="achievement-description">{achievement.description}</p>
								</div>
								{achievement.achieved && <div className="achievement-badge">✓</div>}
							</div>
						))}
					</div>
				</div>
			</div>
			<style>{`
				.statistics {
					max-width: 1200px;
					margin: 0 auto;
				}

				.stats-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
				}

				.period-selector {
					display: flex;
					background: #f8f9fa;
					border-radius: 8px;
					padding: 4px;
				}

				.period-btn {
					padding: 0.5rem 1rem;
					border: none;
					background: transparent;
					border-radius: 4px;
					cursor: pointer;
					transition: all 0.3s;
				}

				.period-btn.active {
					background: #3498db;
					color: white;
				}

				.date-navigation {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 2rem;
					padding: 1rem;
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
				}

				.nav-btn {
					background: #3498db;
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 4px;
					cursor: pointer;
					transition: background-color 0.3s;
				}

				.nav-btn:hover {
					background: #2980b9;
				}

				.current-period {
					margin: 0;
					color: #2c3e50;
				}

				.stats-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 1.5rem;
				}

				.overview-stats {
					grid-column: span 2;
				}

				.overview-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 1rem;
				}

				.overview-item {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
				}

				.overview-icon {
					font-size: 2rem;
				}

				.overview-info {
					display: flex;
					flex-direction: column;
				}

				.overview-value {
					font-size: 1.5rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.overview-value.negative {
					color: #2ecc71;
				}

				.overview-value.positive {
					color: #e74c3c;
				}

				.overview-label {
					font-size: 0.9rem;
					color: #7f8c8d;
				}

				.chart-card {
					grid-column: span 2;
				}

				.chart-container {
					height: 300px;
					padding: 1rem;
				}

				.chart-placeholder {
					height: 100%;
					display: flex;
					flex-direction: column;
				}

				.chart-bars {
					flex: 1;
					display: flex;
					align-items: end;
					justify-content: space-between;
					gap: 0.5rem;
					margin-bottom: 1rem;
				}

				.chart-bar-container {
					flex: 1;
					height: 100%;
					display: flex;
					flex-direction: column;
					align-items: center;
				}

				.chart-bar {
					width: 100%;
					border-radius: 4px 4px 0 0;
					min-height: 10px;
					transition: all 0.3s;
				}

				.chart-bar.below-goal {
					background: #3498db;
				}

				.chart-bar.above-goal {
					background: #e74c3c;
				}

				.chart-label {
					font-size: 0.8rem;
					color: #7f8c8d;
					margin-top: 0.5rem;
				}

				.chart-legend {
					display: flex;
					justify-content: center;
					gap: 2rem;
				}

				.legend-item {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					font-size: 0.9rem;
				}

				.legend-color {
					width: 16px;
					height: 16px;
					border-radius: 2px;
				}

				.legend-color.below-goal {
					background: #3498db;
				}

				.legend-color.above-goal {
					background: #e74c3c;
				}

				.nutrition-trends-grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 1rem;
				}

				.trend-item {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
				}

				.trend-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.trend-label {
					font-weight: 500;
					color: #2c3e50;
				}

				.trend-indicator {
					font-size: 1.2rem;
				}

				.trend-values {
					display: flex;
					align-items: baseline;
					gap: 0.5rem;
				}

				.trend-current {
					font-size: 1.2rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.trend-previous {
					font-size: 0.9rem;
					color: #7f8c8d;
				}

				.achievements {
					grid-column: span 2;
				}

				.achievements-grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 1rem;
				}

				.achievement-item {
					position: relative;
					display: flex;
					align-items: center;
					gap: 1rem;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					transition: all 0.3s;
				}

				.achievement-item.achieved {
					background: #d4edda;
					border-left: 4px solid #28a745;
				}

				.achievement-item.locked {
					opacity: 0.5;
				}

				.achievement-icon {
					font-size: 2rem;
					filter: grayscale(100%);
				}

				.achievement-item.achieved .achievement-icon {
					filter: none;
				}

				.achievement-info {
					flex: 1;
				}

				.achievement-title {
					margin: 0 0 0.25rem 0;
					font-size: 1rem;
					color: #2c3e50;
				}

				.achievement-description {
					margin: 0;
					font-size: 0.9rem;
					color: #7f8c8d;
				}

				.achievement-badge {
					color: #28a745;
					font-size: 1.5rem;
					font-weight: bold;
				}

				@media (max-width: 768px) {
					.stats-header {
						flex-direction: column;
						gap: 1rem;
						align-items: flex-start;
					}

					.date-navigation {
						flex-direction: column;
						gap: 1rem;
					}

					.stats-grid {
						grid-template-columns: 1fr;
					}

					.overview-stats,
					.chart-card,
					.achievements {
						grid-column: span 1;
					}

					.overview-grid {
						grid-template-columns: repeat(2, 1fr);
					}

					.achievements-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</div>
	);
};
export default Statistics;
