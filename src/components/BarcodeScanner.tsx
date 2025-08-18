import React, { useState, useRef } from "react";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface BarcodeScannerProps {
	isOpen: boolean;
	onClose: () => void;
	onBarcodeDetected: (_barcodeResults: {
		barcodes: BarcodeResult[];
		createdFoods: CreatedFood[];
	}) => void;
}

interface BarcodeResult {
	data: string;
	type: string;
	quality?: number;
	orientation?: string;
	rect: { left: number; top: number; width: number; height: number };
	polygon?: Array<[number, number]>;
	is_food_barcode: boolean;
	formatted_data: string;
}

interface CreatedFood {
	id: number;
	name: string;
	brand: string;
	barcode: string;
	serving_size: number;
	serving_unit: string;
	calories_per_100g: number;
	protein_per_100g: number;
	fat_per_100g: number;
	carbs_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
	description: string;
	ingredients: string;
	data_source: string;
	nutrition_grade?: string;
	image_url?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
	isOpen,
	onClose,
	onBarcodeDetected,
}) => {
	const [isScanning, setIsScanning] = useState(false);
	const [scanResults, setScanResults] = useState<{
		barcodes: BarcodeResult[];
		createdFoods: CreatedFood[];
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { showSuccess, showError } = useNotification();

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			showError("请选择图片文件");
			return;
		}

		setIsScanning(true);
		setError(null);
		setScanResults(null);

		try {
			// 1. 上传图片
			const uploadResponse = await imageService.uploadImage(file, "条形码扫描");

			if (!uploadResponse.success || !uploadResponse.data) {
				throw new Error("图片上传失败");
			}

			const imageId = uploadResponse.data.id;

			// 2. 检测条形码
			const barcodeResponse = await imageService.detectBarcodes(imageId);

			if (!barcodeResponse.success || !barcodeResponse.data) {
				throw new Error("条形码检测失败");
			}

			const { food_barcodes_only: foodBarcodes } = barcodeResponse.data;

			if (foodBarcodes.length === 0) {
				showError("未检测到食品条形码");
				setIsScanning(false);
				return;
			}

			// 3. 为每个条形码创建Food对象
			const createdFoods: CreatedFood[] = [];
			let existingCount = 0;
			let newCount = 0;

			for (const barcode of foodBarcodes) {
				try {
					const foodResponse = await imageService.createFoodFromBarcode(
						barcode.data
					);
					if (foodResponse.success && foodResponse.data?.food) {
						createdFoods.push(foodResponse.data.food);
						if (foodResponse.data.is_existing) {
							existingCount++;
						} else {
							newCount++;
						}
					}
				} catch (err) {
					console.warn(`处理食品失败 for barcode ${barcode.data}:`, err);
				}
			}

			setScanResults({
				barcodes: foodBarcodes,
				createdFoods: createdFoods,
			});

			if (createdFoods.length > 0) {
				let message = `成功获取了 ${createdFoods.length} 个食品`;
				if (newCount > 0 && existingCount > 0) {
					message += ` (新创建: ${newCount}个, 已存在: ${existingCount}个)`;
				} else if (newCount > 0) {
					message += ` (新创建: ${newCount}个)`;
				} else if (existingCount > 0) {
					message += ` (已存在数据库中: ${existingCount}个)`;
				}
				showSuccess(message);
			} else {
				showError("未能从条形码获取任何食品信息");
			}

			// 通知父组件
			onBarcodeDetected({
				barcodes: foodBarcodes,
				createdFoods: createdFoods,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "扫描失败";
			setError(errorMessage);
			showError(errorMessage);
		} finally {
			setIsScanning(false);
		}
	};

	const handleTriggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const handleClose = () => {
		setScanResults(null);
		setError(null);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className="modal barcode-scanner-modal">
				<div className="modal-header">
					<h3>条形码扫描识别</h3>
					<button onClick={handleClose} className="close-btn">
						×
					</button>
				</div>

				<div className="scanner-content">
					{/* 文件选择区域 */}
					<div className="upload-section">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							style={{ display: "none" }}
						/>

						<div className="upload-area" onClick={handleTriggerFileInput}>
							{isScanning ? (
								<div className="scanning-indicator">
									<div className="spinner"></div>
									<p>正在扫描条形码...</p>
								</div>
							) : (
								<div className="upload-prompt">
									<div className="upload-icon">📊</div>
									<h4>上传包含条形码的图片</h4>
									<p>支持 UPC、EAN13、EAN8 等食品条形码格式</p>
									<button className="btn btn-primary">选择图片</button>
								</div>
							)}
						</div>
					</div>

					{/* 错误显示 */}
					{error && (
						<div className="error-section">
							<div className="error-message">
								<strong>扫描失败:</strong> {error}
							</div>
						</div>
					)}

					{/* 扫描结果 */}
					{scanResults && (
						<div className="results-section">
							<h4>扫描结果</h4>

							{/* 条形码信息 */}
							<div className="barcodes-section">
								<h5>检测到的条形码 ({scanResults.barcodes.length})</h5>
								{scanResults.barcodes.map((barcode, index) => (
									<div key={index} className="barcode-item">
										<div className="barcode-info">
											<span className="barcode-data">{barcode.formatted_data}</span>
											<span className="barcode-type">{barcode.type}</span>
										</div>
									</div>
								))}
							</div>

							{/* 创建的食品信息 */}
							<div className="created-foods-section">
								<h5>创建的食品 ({scanResults.createdFoods.length})</h5>
								{scanResults.createdFoods.length > 0 ? (
									<div className="created-foods">
										{scanResults.createdFoods.map((food, index) => (
											<div key={index} className="created-food">
												<div className="food-header">
													<h6>{food.name}</h6>
													{food.brand && <span className="food-brand">{food.brand}</span>}
													{food.nutrition_grade && (
														<span
															className={`nutrition-grade grade-${food.nutrition_grade.toLowerCase()}`}
														>
															{food.nutrition_grade.toUpperCase()}
														</span>
													)}
												</div>

												{food.image_url && (
													<img src={food.image_url} alt={food.name} className="food-image" />
												)}

												<div className="nutrition-info">
													<div className="nutrition-grid">
														<div className="nutrition-item">
															<span className="label">热量</span>
															<span className="value">{food.calories_per_100g} kcal/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">蛋白质</span>
															<span className="value">{food.protein_per_100g}g/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">脂肪</span>
															<span className="value">{food.fat_per_100g}g/100g</span>
														</div>
														<div className="nutrition-item">
															<span className="label">碳水化合物</span>
															<span className="value">{food.carbs_per_100g}g/100g</span>
														</div>
														{food.fiber_per_100g > 0 && (
															<div className="nutrition-item">
																<span className="label">膳食纤维</span>
																<span className="value">{food.fiber_per_100g}g/100g</span>
															</div>
														)}
														{food.sugar_per_100g > 0 && (
															<div className="nutrition-item">
																<span className="label">糖分</span>
																<span className="value">{food.sugar_per_100g}g/100g</span>
															</div>
														)}
													</div>

													<div className="food-details">
														<p>
															<strong>条形码:</strong> {food.barcode}
														</p>
														<p>
															<strong>数据来源:</strong> {food.data_source}
														</p>
														{food.ingredients && (
															<p>
																<strong>成分:</strong> {food.ingredients.substring(0, 100)}
																{food.ingredients.length > 100 ? "..." : ""}
															</p>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="no-food-data">未能从条形码创建食品信息</p>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button onClick={handleClose} className="btn btn-secondary">
						关闭
					</button>
				</div>
			</div>

			<style>{`
				.barcode-scanner-modal {
					max-width: 600px;
					max-height: 80vh;
					overflow-y: auto;
				}

				.scanner-content {
					padding: 1.5rem;
				}

				.upload-section {
					margin-bottom: 2rem;
				}

				.upload-area {
					border: 2px dashed #007bff;
					border-radius: 12px;
					padding: 2rem;
					text-align: center;
					cursor: pointer;
					transition: all 0.3s ease;
					background: #f8f9fa;
				}

				.upload-area:hover {
					border-color: #0056b3;
					background: #e7f1ff;
				}

				.upload-prompt {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 1rem;
				}

				.upload-icon {
					font-size: 3rem;
				}

				.upload-prompt h4 {
					margin: 0;
					color: #2c3e50;
				}

				.upload-prompt p {
					margin: 0;
					color: #6c757d;
					font-size: 0.9rem;
				}

				.scanning-indicator {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 1rem;
				}

				.spinner {
					width: 40px;
					height: 40px;
					border: 4px solid #f3f3f3;
					border-top: 4px solid #007bff;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}

				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}

				.error-section {
					margin-bottom: 1rem;
				}

				.error-message {
					background: #f8d7da;
					color: #721c24;
					padding: 1rem;
					border-radius: 8px;
					border: 1px solid #f5c6cb;
				}

				.results-section {
					background: #f8f9fa;
					border-radius: 12px;
					padding: 1.5rem;
				}

				.results-section h4 {
					margin: 0 0 1.5rem 0;
					color: #2c3e50;
					text-align: center;
				}

				.barcodes-section, .usda-section {
					margin-bottom: 1.5rem;
				}

				.barcodes-section h5, .usda-section h5 {
					margin: 0 0 1rem 0;
					color: #495057;
					font-size: 1rem;
					border-bottom: 2px solid #dee2e6;
					padding-bottom: 0.5rem;
				}

				.barcode-item {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
					margin-bottom: 0.5rem;
				}

				.barcode-info {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				.barcode-data {
					font-family: 'Courier New', monospace;
					font-size: 1.1rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.barcode-type {
					background: var(--success-alt);
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.created-foods {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.created-food {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
				}

				.food-header {
					display: flex;
					align-items: center;
					gap: 1rem;
					margin-bottom: 0.5rem;
					flex-wrap: wrap;
				}

				.food-header h6 {
					margin: 0;
					color: #2c3e50;
					font-size: 1.1rem;
					flex: 1;
				}

				.food-brand {
					background: #007bff;
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.nutrition-grade {
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
					color: white;
				}

				.grade-a { background: var(--success-alt); }
				.grade-b { background: #ffc107; color: #212529; }
				.grade-c { background: #fd7e14; }
				.grade-d { background: #dc3545; }
				.grade-e { background: #6f42c1; }

				.food-image {
					width: 80px;
					height: 80px;
					object-fit: cover;
					border-radius: 8px;
					margin-bottom: 1rem;
				}

				.nutrition-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
					gap: 0.5rem;
					margin-bottom: 1rem;
				}

				.nutrition-item {
					display: flex;
					justify-content: space-between;
					padding: 0.5rem;
					background: #f8f9fa;
					border-radius: 4px;
				}

				.nutrition-item .label {
					font-weight: 500;
					color: #495057;
				}

				.nutrition-item .value {
					font-weight: bold;
					color: #007bff;
				}

				.food-details p {
					margin: 0.25rem 0;
					font-size: 0.9rem;
					color: #6c757d;
				}

				.no-food-data {
					text-align: center;
					color: #6c757d;
					font-style: italic;
					margin: 1rem 0;
				}

				.modal-footer {
					padding: 1rem 1.5rem;
					border-top: 1px solid #e9ecef;
					display: flex;
					justify-content: flex-end;
				}

				@media (max-width: 768px) {
					.barcode-scanner-modal {
						max-width: 95vw;
						margin: 1rem;
					}

					.upload-area {
						padding: 1.5rem 1rem;
					}

					.upload-icon {
						font-size: 2rem;
					}

					.barcode-info {
						flex-direction: column;
						gap: 0.5rem;
						align-items: flex-start;
					}
				}
			`}</style>
		</div>
	);
};

export default BarcodeScanner;
