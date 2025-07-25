import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentLocalDate } from "../utils/timezone";
import ImageUpload from "../components/ImageUpload";
import { useNotification } from "../contexts/NotificationContext";

interface DashboardProps {
	onLoginRequired: () => void;
}

const Dashboard = ({ onLoginRequired }: DashboardProps) => {
	const { isAuthenticated } = useAuth();
	const { success, error } = useNotification();
	const todayDate = new Date(getCurrentLocalDate()).toLocaleDateString("zh-CN");
	
	// 图像识别相关状态
	const [recognizedFoods, setRecognizedFoods] = useState<any[]>([]);
	const [imageRecognitionHistory, setImageRecognitionHistory] = useState<any[]>([]);
	const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);

	// 清理资源
	useEffect(() => {
		return () => {
			// 组件卸载时清理预览URL
			if (currentImagePreview) {
				URL.revokeObjectURL(currentImagePreview);
			}
		};
	}, [currentImagePreview]);

	// 处理图像识别结果
	const handleImageRecognitionResults = (imageId: number, results: any, imagePreview?: string) => {
		console.log("Dashboard - Image recognition results:", { imageId, results });
		
		// 设置当前图片预览
		if (imagePreview) {
			// 清理之前的预览URL
			if (currentImagePreview) {
				URL.revokeObjectURL(currentImagePreview);
			}
			setCurrentImagePreview(imagePreview);
			setCurrentImageId(imageId);
		}
		
		if (results && results.keywords && results.keywords.length > 0) {
			// 使用关键词创建简化的食物数据
			const recognizedFoods = results.keywords.map((keyword: string, index: number) => ({
				id: index + 1,
				name: keyword,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				calories_per_100g: 100, // 模拟数据
				isKeyword: true // 标记这是关键词结果
			}));
			
			setRecognizedFoods(recognizedFoods);
			
			// 添加到识别历史
			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: results.keywords.join(", ")
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]); // 只保留最近5次
			
			// 显示成功消息
			success(`识别到 ${recognizedFoods.length} 个食物关键词！`);
		} else if (results && results.results && results.results.length > 0) {
			// 处理完整的识别结果（向后兼容）
			const recognizedFoods = results.results.map((result: any) => ({
				...result.food,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN")
			}));
			
			setRecognizedFoods(recognizedFoods);
			
			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: recognizedFoods.map((food: any) => food.name).join(", ")
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]);
			
			success(`识别到 ${recognizedFoods.length} 种食物！`);
		} else {
			// 没有识别到食物
			error("未能识别到食物，请尝试拍摄更清晰的图片");
		}
	};

	// 清除当前图片预览
	const clearCurrentImage = () => {
		if (currentImagePreview) {
			URL.revokeObjectURL(currentImagePreview);
			setCurrentImagePreview(null);
			setCurrentImageId(null);
			setRecognizedFoods([]);
		}
	};

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
				{/* 图像识别 */}
				<div className="card image-recognition-card">
					<div className="card-header">
						<h3 className="card-title">📸 拍照识别食物</h3>
					</div>
					<div className="image-recognition-content">
						<div className="upload-section">
							{currentImagePreview ? (
								<div className="image-preview-container">
									<img 
										src={currentImagePreview} 
										alt="上传的食物图片" 
										className="uploaded-image-preview"
									/>
									<div className="image-overlay">
										<ImageUpload
											onImageUploaded={handleImageRecognitionResults}
											disabled={!isAuthenticated}
										/>
										<button 
											className="btn btn-secondary clear-btn"
											onClick={clearCurrentImage}
											title="清除当前图片"
										>
											✕
										</button>
									</div>
								</div>
							) : (
								<>
									<p className="upload-description">上传食物图片，AI会自动识别并分析营养成分</p>
									<ImageUpload
										onImageUploaded={handleImageRecognitionResults}
										disabled={!isAuthenticated}
									/>
								</>
							)}
						</div>
						
						{recognizedFoods.length > 0 && (
							<div className="recognition-results">
								<h4>识别结果：</h4>
								{recognizedFoods[0]?.isKeyword && (
									<p className="keyword-hint">以下是识别到的食物关键词，可用于搜索更准确的食物信息</p>
								)}
								<div className="recognized-foods">
									{recognizedFoods.map((food, index) => (
										<div key={index} className={`recognized-food-item ${food.isKeyword ? "keyword-item" : ""}`}>
											<div className="food-name">{food.name}</div>
											<div className="food-info">
												{food.isKeyword ? (
													<span className="keyword-label">搜索关键词</span>
												) : (
													food.calories_per_100g && (
														<span className="calories">{food.calories_per_100g} kcal/100g</span>
													)
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
						
						{imageRecognitionHistory.length > 0 && (
							<div className="recognition-history">
								<h4>识别历史：</h4>
								<div className="history-list">
									{imageRecognitionHistory.map((item, index) => (
										<div key={index} className="history-item">
											<div className="history-time">{item.recognizedAt}</div>
											<div className="history-foods">识别到 {item.foodCount} 种食物：{item.foods}</div>
										</div>
									))}
								</div>
							</div>
						)}
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

				/* 图像识别样式 */
				.image-recognition-card {
					margin-bottom: 1.5rem;
				}

				.image-recognition-content {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				.upload-section {
					text-align: center;
					padding: 1rem;
					border: 2px dashed #e9ecef;
					border-radius: 8px;
					background: #f8f9fa;
					position: relative;
					min-height: 200px;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}

				.upload-description {
					margin-bottom: 1rem;
					color: #6c757d;
					font-size: 0.9rem;
				}

				.image-preview-container {
					position: relative;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
				}

				.uploaded-image-preview {
					max-width: 100%;
					max-height: 300px;
					border-radius: 8px;
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
					object-fit: contain;
				}

				.image-overlay {
					position: absolute;
					bottom: 10px;
					right: 10px;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 8px;
					padding: 0.5rem;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
					display: flex;
					gap: 0.5rem;
					align-items: center;
				}

				.image-overlay .btn {
					background: #007bff;
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 6px;
					font-size: 0.85rem;
					cursor: pointer;
					transition: all 0.3s ease;
				}

				.image-overlay .btn:hover:not(:disabled) {
					background: #0056b3;
					transform: translateY(-1px);
				}

				.clear-btn {
					background: #6c757d !important;
					color: white;
					padding: 0.3rem 0.6rem !important;
					font-size: 0.8rem !important;
					min-width: auto;
					line-height: 1;
				}

				.clear-btn:hover:not(:disabled) {
					background: #5a6268 !important;
				}

				.recognition-results {
					padding: 1rem;
					background: #e8f5e8;
					border-radius: 8px;
					border-left: 4px solid #28a745;
				}

				.recognition-results h4 {
					margin: 0 0 0.75rem 0;
					color: #155724;
					font-size: 1rem;
				}

				.recognized-foods {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 0.75rem;
				}

				.recognized-food-item {
					padding: 0.75rem;
					background: white;
					border-radius: 6px;
					border: 1px solid #c3e6cb;
				}

				.food-name {
					font-weight: bold;
					color: #155724;
					margin-bottom: 0.25rem;
				}

				.food-info {
					font-size: 0.85rem;
					color: #6c757d;
				}

				.calories {
					background: #d4edda;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-size: 0.8rem;
				}

				.keyword-hint {
					margin-bottom: 0.75rem;
					padding: 0.5rem;
					background: #fff3cd;
					border: 1px solid #ffeaa7;
					border-radius: 4px;
					font-size: 0.85rem;
					color: #856404;
				}

				.keyword-item {
					background: #f8f9ff;
					border: 1px solid #c3d4f7;
				}

				.keyword-label {
					background: #e3f2fd;
					color: #1976d2;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: 500;
				}

				.recognition-history {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #6c757d;
				}

				.recognition-history h4 {
					margin: 0 0 0.75rem 0;
					color: #495057;
					font-size: 1rem;
				}

				.history-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.history-item {
					padding: 0.5rem;
					background: white;
					border-radius: 4px;
					border: 1px solid #dee2e6;
				}

				.history-time {
					font-size: 0.8rem;
					color: #6c757d;
					margin-bottom: 0.25rem;
				}

				.history-foods {
					font-size: 0.85rem;
					color: #495057;
				}

				@media (max-width: 768px) {
					.recognized-foods {
						grid-template-columns: 1fr;
					}
					
					.upload-section {
						padding: 0.75rem;
						min-height: 150px;
					}

					.uploaded-image-preview {
						max-height: 200px;
					}

					.image-overlay {
						bottom: 5px;
						right: 5px;
						padding: 0.25rem;
					}

					.image-overlay .btn {
						padding: 0.4rem 0.8rem;
						font-size: 0.8rem;
					}
				}
			`}</style>
		</div>
	);
};
export default Dashboard;
