import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { createLocalDate } from "../utils/timezone";

interface StatisticsProps {
	onLoginRequired: () => void;
}

const Statistics = ({ onLoginRequired }: StatisticsProps) => {
	const { t } = useTranslation();
	const { isAuthenticated } = useAuth();
	const [selectedPeriod, setSelectedPeriod] = React.useState<
		"week" | "month" | "year"
	>("week");
	const [currentDate, setCurrentDate] = React.useState(
		createLocalDate(new Date().toISOString().split("T")[0])
	);
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
		{
			id: 1,
			title: t("statistics.achievementsList.streak7Days"),
			description: t("statistics.achievementsList.streak7DaysDesc"),
			achieved: true,
			icon: "🏆",
		},
		{
			id: 2,
			title: t("statistics.achievement1", "Reached Calorie Goal"),
			description: t(
				"statistics.achievement1Desc",
				"Daily calorie intake on target"
			),
			achieved: true,
			icon: "🎯",
		},
		{
			id: 3,
			title: t("statistics.achievementsList.proteinGoal"),
			description: t("statistics.achievementsList.proteinGoalDesc"),
			achieved: true,
			icon: "💪",
		},
		{
			id: 4,
			title: t("statistics.achievementsList.weightLoss"),
			description: t("statistics.achievementsList.weightLossDesc"),
			achieved: true,
			icon: "📉",
		},
		{
			id: 5,
			title: t("statistics.achievementsList.streak30Days"),
			description: t("statistics.achievementsList.streak30DaysDesc"),
			achieved: false,
			icon: "🔥",
		},
		{
			id: 6,
			title: t("statistics.achievementsList.perfectWeek"),
			description: t("statistics.achievementsList.perfectWeekDesc"),
			achieved: false,
			icon: "⭐",
		},
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
			return currentDate.toLocaleDateString("zh-CN", {
				year: "numeric",
				month: "long",
			});
		} else {
			return currentDate.getFullYear().toString();
		}
	};
	const calculateStats = () => {
		const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
		const avgCalories = Math.round(totalCalories / weeklyData.length);
		const avgWeight =
			Math.round(
				(weeklyData.reduce((sum, day) => sum + day.weight, 0) / weeklyData.length) *
					10
			) / 10;
		const daysOnTarget = weeklyData.filter(
			day => day.calories >= day.goal * 0.9 && day.calories <= day.goal * 1.1
		).length;
		const weightChange =
			Math.round(
				(weeklyData[weeklyData.length - 1].weight - weeklyData[0].weight) * 10
			) / 10;

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
			newDate.setFullYear(
				currentDate.getFullYear() + (direction === "next" ? 1 : -1)
			);
		}
		setCurrentDate(newDate);
	};

	if (!isAuthenticated) {
		return (
			<div className="statistics">
				<div className="not-authenticated">
					<h2>{t("statistics.title")}</h2>
					<p>{t("auth.loginToAccess")}</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						{t("auth.login")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="statistics">
			<div className="stats-header">
				<h1>{t("statistics.title")}</h1>

				<div className="period-selector">
					<button
						className={`period-btn ${selectedPeriod === "week" ? "active" : ""}`}
						onClick={() => setSelectedPeriod("week")}
					>
						{t("statistics.week")}
					</button>
					<button
						className={`period-btn ${selectedPeriod === "month" ? "active" : ""}`}
						onClick={() => setSelectedPeriod("month")}
					>
						{t("statistics.month")}
					</button>
					<button
						className={`period-btn ${selectedPeriod === "year" ? "active" : ""}`}
						onClick={() => setSelectedPeriod("year")}
					>
						{t("statistics.year")}
					</button>
				</div>
			</div>
			<div className="date-navigation">
				<button onClick={() => navigateDate("prev")} className="nav-btn">
					← {t("statistics.previous")}
					{selectedPeriod === "week"
						? t("statistics.week")
						: selectedPeriod === "month"
							? t("statistics.month")
							: t("statistics.year")}
				</button>
				<h2 className="current-period">{getDateRange()}</h2>
				<button onClick={() => navigateDate("next")} className="nav-btn">
					{t("statistics.next")}
					{selectedPeriod === "week"
						? t("statistics.week")
						: selectedPeriod === "month"
							? t("statistics.month")
							: t("statistics.year")}{" "}
					→
				</button>
			</div>
			<div className="stats-grid">
				{/* Overview Statistics */}
				<div className="card overview-stats">
					<div className="card-header">
						<h3 className="card-title">{t("statistics.thisWeek")}</h3>
					</div>

					<div className="overview-grid">
						<div className="overview-item">
							<div className="overview-icon">🍽️</div>
							<div className="overview-info">
								<span className="overview-value">{stats.avgCalories}</span>
								<span className="overview-label">
									{t("statistics.averageCalories")}
								</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">⚖️</div>
							<div className="overview-info">
								<span className="overview-value">{stats.avgWeight}</span>
								<span className="overview-label">{t("statistics.averageWeight")}</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">🎯</div>
							<div className="overview-info">
								<span className="overview-value">{stats.daysOnTarget}</span>
								<span className="overview-label">{t("statistics.targetDays")}</span>
							</div>
						</div>

						<div className="overview-item">
							<div className="overview-icon">📈</div>
							<div className="overview-info">
								<span
									className={`overview-value ${stats.weightChange < 0 ? "negative" : "positive"}`}
								>
									{stats.weightChange > 0 ? "+" : ""}
									{stats.weightChange}
								</span>
								<span className="overview-label">
									{t("statistics.weightProgress")} ({t("common.kilograms")})
								</span>
							</div>
						</div>
					</div>
				</div>
				{/* Calorie Trends Chart */}
				<div className="card chart-card">
					<div className="card-header">
						<h3 className="card-title">{t("statistics.calorieTrend")}</h3>
					</div>

					<div className="chart-container">
						<div className="chart-placeholder">
							<div className="chart-bars">
								{weeklyData.map((day, index) => {
									const height = (day.calories / 2500) * 100;
									const isAboveGoal = day.calories > day.goal;
									return (
										<div key={index} className="chart-bar-container">
											<div
												className={`chart-bar ${isAboveGoal ? "above-goal" : "below-goal"}`}
												style={{ height: `${height}%` }}
												title={`${day.calories} kcal`}
											></div>
											<div className="chart-label">
												{new Date(day.date).toLocaleDateString("zh-CN", {
													weekday: "short",
												})}
											</div>
										</div>
									);
								})}
							</div>
							<div className="chart-legend">
								<div className="legend-item">
									<div className="legend-color below-goal"></div>
									<span>{t("statistics.underGoal")}</span>
								</div>
								<div className="legend-item">
									<div className="legend-color above-goal"></div>
									<span>{t("statistics.overGoal")}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* Nutrition Trends */}
				<div className="card nutrition-trends">
					<div className="card-header">
						<h3 className="card-title">{t("statistics.nutritionTrend")}</h3>
					</div>

					<div className="nutrition-trends-grid">
						{Object.entries(nutritionTrends).map(([key, data]) => {
							const labels: Record<string, string> = {
								protein: t("statistics.proteinNutrient"),
								fat: t("statistics.fatNutrient"),
								carbs: t("statistics.carbsNutrient"),
								fiber: t("statistics.fiberNutrient"),
							};

							return (
								<div key={key} className="trend-item">
									<div className="trend-header">
										<span className="trend-label">{labels[key]}</span>
										<span className={`trend-indicator ${data.trend}`}>
											{data.trend === "up" ? "↗️" : "↘️"}
										</span>
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
				{/* Achievement System */}
				<div className="card achievements">
					<div className="card-header">
						<h3 className="card-title">{t("statistics.achievementsBadges")}</h3>
					</div>

					<div className="achievements-grid">
						{achievements.map(achievement => (
							<div
								key={achievement.id}
								className={`achievement-item ${achievement.achieved ? "achieved" : "locked"}`}
							>
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
				.not-authenticated {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: var(--shadow-medium);
				}

				.not-authenticated h2 {
					margin-bottom: 1rem;
					color: #2c3e50;
				}

				.not-authenticated p {
					margin-bottom: 2rem;
					color: #7f8c8d;
				}

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
					background: var(--primary-color);
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
					box-shadow: var(--shadow-medium);
				}

				.nav-btn {
					background: var(--primary-color);
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
					color: var(--success-color);
				}

				.overview-value.positive {
					color: var(--danger-btn);
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
					background: var(--primary-color);
				}

				.chart-bar.above-goal {
					background: var(--danger-btn);
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
					background: var(--primary-color);
				}

				.legend-color.above-goal {
					background: var(--danger-btn);
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
					border-left: 4px solid var(--success-alt);
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
					color: var(--success-alt);
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
