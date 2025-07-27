import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentLocalDate } from "../utils/timezone";
import ImageUpload from "../components/ImageUpload";
import BarcodeScanner from "../components/BarcodeScanner";
import { useNotification } from "../contexts/NotificationContext";

interface DashboardProps {
	onLoginRequired: () => void;
}

const Dashboard = ({ onLoginRequired }: DashboardProps) => {
	const { isAuthenticated } = useAuth();
	const { success, error } = useNotification();
	const todayDate = new Date(getCurrentLocalDate()).toLocaleDateString("zh-CN");

	// 图像识别相关状态
	const [imageRecognitionHistory, setImageRecognitionHistory] = useState<any[]>([]);
	const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);

	// 流式分析状态
	const [analysisProgress, setAnalysisProgress] = useState<number>(0);
	const [analysisStep, setAnalysisStep] = useState<string>("");
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
	const [detectedFoods, setDetectedFoods] = useState<any[]>([]);
	const [estimatedPortions, setEstimatedPortions] = useState<any[]>([]);

	// 条形码扫描状态
	const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
	const [barcodeResults, setBarcodeResults] = useState<any>(null);

	// 清理资源
	useEffect(() => {
		return () => {
			// 组件卸载时清理预览URL
			if (currentImagePreview) {
				URL.revokeObjectURL(currentImagePreview);
			}
		};
	}, [currentImagePreview]);

	// 检查URL参数，如果有条形码模式则打开扫描器
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const mode = urlParams.get("mode");
		
		if (mode === "barcode") {
			setShowBarcodeScanner(true);
			// 清理URL参数
			window.history.replaceState(null, "", window.location.pathname);
		}
	}, []);

	// 处理图片预览（立即显示）
	const handleImagePreview = (imagePreview: string) => {
		// 清理之前的预览URL
		if (currentImagePreview) {
			URL.revokeObjectURL(currentImagePreview);
		}
		setCurrentImagePreview(imagePreview);
		// 清空之前的识别结果
		setDetectedFoods([]);
		setEstimatedPortions([]);
		setAnalysisProgress(0);
		setAnalysisStep("");
		setIsAnalyzing(true);
	};

	// 处理流式分析进度
	const handleStreamingProgress = (data: {
		step: string;
		message?: string;
		progress?: number;
		foods?: any[];
		portions?: any[];
		stage_1?: any;
		stage_2?: any;
	}) => {
		console.log("Streaming progress:", data);

		setAnalysisStep(data.step);

		if (data.progress !== undefined) {
			setAnalysisProgress(data.progress);
		}

		// 检查是否有 portions 数据（不管在哪个阶段）
		if (data.portions) {
			setEstimatedPortions(data.portions);
		}
		if (data.stage_2?.portions) {
			setEstimatedPortions(data.stage_2.portions);
		}
		// 检查 food_portions 字段
		if (data.stage_2?.food_portions) {
			setEstimatedPortions(data.stage_2.food_portions);
		}

		switch (data.step) {
			case "start":
				setIsAnalyzing(true);
				break;

			case "food_detection":
				// 正在检测食物
				break;

			case "food_detection_complete":
				if (data.foods) {
					setDetectedFoods(data.foods);
				}
				break;

			case "portion_estimation":
				// 正在估算分量
				// 这里可能也会有 portions 数据
				if (data.portions) {
					setEstimatedPortions(data.portions);
				}
				break;

			case "complete":
				setIsAnalyzing(false);
				if (data.stage_1?.food_types) {
					setDetectedFoods(data.stage_1.food_types);
				}
				if (data.stage_2?.portions) {
					setEstimatedPortions(data.stage_2.portions);
				}
				// 也检查 food_portions 字段
				if (data.stage_2?.food_portions) {
					setEstimatedPortions(data.stage_2.food_portions);
				}
				break;

			case "error":
				setIsAnalyzing(false);
				error(data.message || "分析过程中出现错误");
				break;
		}
	};

	// 处理图像识别结果
	const handleImageRecognitionResults = (
		imageId: number,
		results: any,
		imagePreview?: string
	) => {
		console.log("Dashboard - Image recognition results:", { imageId, results });

		// 设置当前图片ID
		setCurrentImageId(imageId);

		// 如果还没有预览图（备用处理）
		if (imagePreview && !currentImagePreview) {
			setCurrentImagePreview(imagePreview);
		}

		if (results && results.keywords && results.keywords.length > 0) {
			// 使用关键词创建简化的食物数据
			const recognizedFoods = results.keywords.map((keyword: string, index: number) => ({
				id: index + 1,
				name: keyword,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				calories_per_100g: 100, // 模拟数据
				isKeyword: true, // 标记这是关键词结果
			}));

			// 添加到识别历史
			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: results.keywords.join(", "),
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]); // 只保留最近5次

			// 显示成功消息
			success(`识别到 ${recognizedFoods.length} 个食物关键词！`);
		} else if (results && results.portions && results.portions.length > 0) {
			// 处理新的portions格式的识别结果
			const recognizedFoods = results.portions.map((portion: any, index: number) => ({
				id: index + 1,
				name: portion.name,
				estimated_grams: portion.estimated_grams,
				cooking_method: portion.cooking_method,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				isKeyword: false,
			}));

			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: recognizedFoods.map((food: any) => food.name).join(", "),
			};
			setImageRecognitionHistory(prev => [historyItem, ...prev.slice(0, 4)]);

			success(`识别到 ${recognizedFoods.length} 种食物！`);
		} else if (results && results.results && results.results.length > 0) {
			// 处理完整的识别结果（向后兼容）
			const recognizedFoods = results.results.map((result: any) => ({
				...result.food,
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
			}));

			const historyItem = {
				imageId,
				recognizedAt: new Date().toLocaleString("zh-CN"),
				foodCount: recognizedFoods.length,
				foods: recognizedFoods.map((food: any) => food.name).join(", "),
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
			setEstimatedPortions([]);
		}
	};

	// 处理条形码检测结果
	const handleBarcodeDetected = (results: any) => {
		console.log("Barcode detection results:", results);
		setBarcodeResults(results);
		
		if (results.usdaProducts && results.usdaProducts.length > 0) {
			success(`找到 ${results.usdaProducts.length} 个USDA产品`);
		}
	};

	// 打开条形码扫描器
	const openBarcodeScanner = () => {
		setShowBarcodeScanner(true);
	};

	// 关闭条形码扫描器
	const closeBarcodeScanner = () => {
		setShowBarcodeScanner(false);
		setBarcodeResults(null);
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
						<button
							className="btn btn-info"
							onClick={openBarcodeScanner}
							disabled={!isAuthenticated}
						>
							📊 条形码扫描
						</button>
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
											onImagePreview={handleImagePreview}
											onStreamingProgress={handleStreamingProgress}
											disabled={!isAuthenticated}
											useStreaming={true}
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
									<p className="upload-description">
										上传食物图片，AI会自动识别并分析营养成分
									</p>
									<ImageUpload
										onImageUploaded={handleImageRecognitionResults}
										onImagePreview={handleImagePreview}
										onStreamingProgress={handleStreamingProgress}
										disabled={!isAuthenticated}
										useStreaming={true}
									/>
								</>
							)}
						</div>

						{/* 流式分析进度显示 */}
						{isAnalyzing && (
							<div className="analysis-progress">
								<div className="progress-header">
									<h4>
										分析进度：
										{analysisStep === "food_detection"
											? "识别食物中..."
											: analysisStep === "portion_estimation"
												? "估算分量中..."
												: "处理中..."}
									</h4>
									<div className="progress-percentage">{analysisProgress}%</div>
								</div>
								<div className="progress-bar">
									<div
										className="progress-fill"
										style={{ width: `${analysisProgress}%` }}
									></div>
								</div>

								{/* 显示已检测到的食物 */}
								{detectedFoods.length > 0 && (
									<div className="detected-foods">
										<h5>检测到的食物：</h5>
										<div className="foods-list">
											{detectedFoods.map((food, index) => (
												<span key={index} className="food-item">
													{food.name}
													{food.confidence && (
														<span className="confidence">
															({Math.round(food.confidence * 100)}%)
														</span>
													)}
												</span>
											))}
										</div>
									</div>
								)}

								{estimatedPortions.length > 0 && (
									<div className="estimated-portions">
										<h5>估算分量：</h5>
										<div className="portions-list">
											{estimatedPortions.map((portion, index) => (
												<div key={index} className="portion-item">
													<span className="food-name">
														{portion.name}:
													</span>
													<span className="portion-amount">
														{portion.estimated_grams}g
													</span>
													{portion.cooking_method && (
														<span className="portion-desc">
															({portion.cooking_method})
														</span>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{estimatedPortions.length > 0 && (
							<div className="recognition-results">
								<h4>识别结果：</h4>
								<div className="estimated-portions-final">
									{estimatedPortions.map((portion, index) => (
										<div key={index} className="recognized-food-item">
											<div className="food-name">{portion.name}</div>
											<div className="food-info">
												<div className="food-details">
													<div className="weight-recommendation">
														<span className="weight-label">
															识别重量：
														</span>
														<span className="weight-amount">
															{portion.estimated_grams}g
														</span>
														{portion.cooking_method && (
															<span className="cooking-method">
																({portion.cooking_method})
															</span>
														)}
													</div>
												</div>
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
											<div className="history-foods">
												识别到 {item.foodCount} 种食物：{item.foods}
											</div>
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
							onClick={() =>
								isAuthenticated ? console.log("Add meal") : onLoginRequired()
							}
						>
							+ 添加食物篮
						</button>
					</div>
					<div className="meals-list">
						{recentMeals.map(meal => (
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

				{/* 条形码识别结果 */}
				{barcodeResults && (
					<div className="card barcode-results-card">
						<div className="card-header">
							<h3 className="card-title">📊 条形码识别结果</h3>
							<button
								className="btn btn-secondary"
								onClick={() => setBarcodeResults(null)}
							>
								清除结果
							</button>
						</div>
						<div className="barcode-results-content">
							{/* 检测到的条形码 */}
							<div className="detected-barcodes">
								<h4>检测到的条形码</h4>
								<div className="barcodes-list">
									{barcodeResults.barcodes?.map((barcode: any, index: number) => (
										<div key={index} className="barcode-item">
											<div className="barcode-data">
												<span className="barcode-number">{barcode.formatted_data}</span>
												<span className="barcode-type">{barcode.type}</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* USDA产品信息 */}
							{barcodeResults.usdaProducts?.length > 0 && (
								<div className="usda-products">
									<h4>找到的USDA产品</h4>
									<div className="products-list">
										{barcodeResults.usdaProducts.map((product: any, index: number) => (
											<div key={index} className="usda-product-item">
												<h5>{product.description}</h5>
												<div className="product-details">
													{product.brand_owner && (
														<p><strong>品牌:</strong> {product.brand_owner}</p>
													)}
													<p><strong>FDC ID:</strong> {product.fdc_id}</p>
													<p><strong>数据类型:</strong> {product.data_type}</p>
													{product.serving_size && (
														<p><strong>建议份量:</strong> {product.serving_size} {product.serving_size_unit}</p>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{barcodeResults.usdaProducts?.length === 0 && (
								<div className="no-usda-results">
									<p>未找到对应的USDA营养数据，但您可以手动搜索该产品或创建自定义食物。</p>
								</div>
							)}
						</div>
					</div>
				)}
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

				.food-details {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.weight-recommendation {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					flex-wrap: wrap;
				}

				.weight-label {
					font-size: 0.8rem;
					color: #495057;
					font-weight: 500;
				}

				.weight-amount {
					background: #28a745;
					color: white;
					padding: 0.2rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.cooking-method {
					font-size: 0.75rem;
					color: #6c757d;
					font-style: italic;
					background: #f8f9fa;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
				}

				.confidence-score {
					display: flex;
					align-items: center;
					gap: 0.3rem;
				}

				.confidence-label {
					font-size: 0.75rem;
					color: #6c757d;
				}

				.confidence-value {
					background: #17a2b8;
					color: white;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
					font-size: 0.75rem;
					font-weight: 500;
				}

				.calories {
					background: #d4edda;
					padding: 0.2rem 0.4rem;
					border-radius: 4px;
					font-size: 0.8rem;
					align-self: flex-start;
				}

				.estimated-calories {
					display: flex;
					align-items: center;
					gap: 0.3rem;
				}

				.calories-label {
					font-size: 0.75rem;
					color: #6c757d;
				}

				.calories-value {
					background: #fd7e14;
					color: white;
					padding: 0.1rem 0.3rem;
					border-radius: 3px;
					font-size: 0.75rem;
					font-weight: 500;
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

				/* 流式分析进度样式 */
				.analysis-progress {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #007bff;
					margin-bottom: 1rem;
				}

				.progress-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5rem;
				}

				.progress-header h4 {
					margin: 0;
					color: #495057;
					font-size: 1rem;
				}

				.progress-percentage {
					font-weight: bold;
					color: #007bff;
				}

				.progress-bar {
					width: 100%;
					height: 8px;
					background: #e9ecef;
					border-radius: 4px;
					overflow: hidden;
					margin-bottom: 1rem;
				}

				.progress-fill {
					height: 100%;
					background: linear-gradient(90deg, #007bff, #0056b3);
					transition: width 0.3s ease;
				}

				.detected-foods, .estimated-portions {
					margin-top: 1rem;
					padding-top: 1rem;
					border-top: 1px solid #dee2e6;
				}

				.detected-foods h5, .estimated-portions h5 {
					margin: 0 0 0.5rem 0;
					color: #343a40;
					font-size: 0.9rem;
				}

				.foods-list {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
				}

				.food-item {
					background: #e3f2fd;
					color: #1976d2;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					border: 1px solid #bbdefb;
				}

				.confidence {
					opacity: 0.7;
					font-size: 0.7rem;
				}

				.portions-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.portion-item {
					display: flex;
					gap: 0.5rem;
					align-items: center;
					padding: 0.5rem;
					background: #fff3e0;
					border: 1px solid #ffcc02;
					border-radius: 4px;
					font-size: 0.85rem;
				}

				.food-name {
					font-weight: bold;
					color: #e65100;
				}

				.portion-amount {
					background: #ff9800;
					color: white;
					padding: 0.2rem 0.4rem;
					border-radius: 3px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.portion-desc {
					color: #757575;
					font-style: italic;
				}

				/* 条形码识别结果样式 */
				.barcode-results-card {
					margin-top: 1.5rem;
				}

				.barcode-results-content {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				.detected-barcodes, .usda-products {
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					border-left: 4px solid #17a2b8;
				}

				.detected-barcodes h4, .usda-products h4 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 1rem;
				}

				.barcodes-list {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.barcode-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 6px;
					padding: 0.75rem;
				}

				.barcode-data {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.barcode-number {
					font-family: 'Courier New', monospace;
					font-size: 1.1rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.barcode-type {
					background: #28a745;
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.products-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.usda-product-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
				}

				.usda-product-item h5 {
					margin: 0 0 0.75rem 0;
					color: #2c3e50;
					font-size: 1rem;
					line-height: 1.4;
				}

				.product-details {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.product-details p {
					margin: 0;
					font-size: 0.9rem;
					color: #6c757d;
				}

				.no-usda-results {
					padding: 1rem;
					background: #fff3cd;
					border: 1px solid #ffeaa7;
					border-radius: 8px;
					text-align: center;
				}

				.no-usda-results p {
					margin: 0;
					color: #856404;
					font-style: italic;
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

					.barcode-data {
						flex-direction: column;
						gap: 0.5rem;
						align-items: flex-start;
					}
				}
			`}</style>

			{/* 条形码扫描器模态框 */}
			<BarcodeScanner
				isOpen={showBarcodeScanner}
				onClose={closeBarcodeScanner}
				onBarcodeDetected={handleBarcodeDetected}
			/>
		</div>
	);
};
export default Dashboard;
