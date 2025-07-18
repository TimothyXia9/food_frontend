import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface MealStatsProps {
	onLoginRequired: () => void;
}

const MealStats = ({ onLoginRequired }: MealStatsProps) => {
	const { isAuthenticated } = useAuth();

	React.useEffect(() => {
		if (!isAuthenticated) {
			onLoginRequired();
		}
	}, [isAuthenticated, onLoginRequired]);

	if (!isAuthenticated) {
		return (
			<div className="meal-stats-login-required">
				<div className="login-prompt">
					<h2>📊 每餐统计</h2>
					<p>请登录以查看您的餐食统计数据</p>
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
			
			<div className="stats-content">
				<div className="stats-placeholder">
					<div className="placeholder-icon">🍽️</div>
					<h3>餐食统计功能正在开发中...</h3>
					<p>即将为您提供以下功能：</p>
					<div className="feature-list">
						<div className="feature-item">
							<span className="feature-icon">📈</span>
							<span>今日各餐营养摄入分析</span>
						</div>
						<div className="feature-item">
							<span className="feature-icon">🔥</span>
							<span>每餐卡路里分布图表</span>
						</div>
						<div className="feature-item">
							<span className="feature-icon">⚖️</span>
							<span>营养素平衡对比</span>
						</div>
						<div className="feature-item">
							<span className="feature-icon">📅</span>
							<span>餐食历史记录和趋势</span>
						</div>
						<div className="feature-item">
							<span className="feature-icon">🎯</span>
							<span>目标达成情况分析</span>
						</div>
						<div className="feature-item">
							<span className="feature-icon">📋</span>
							<span>周/月度营养报告</span>
						</div>
					</div>
					<div className="coming-soon">
						<p>🚀 敬请期待更多精彩功能！</p>
					</div>
				</div>
			</div>

			<style>{`
				.meal-stats {
					max-width: 1000px;
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