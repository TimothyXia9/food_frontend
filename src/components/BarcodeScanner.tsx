import React, { useState, useRef } from "react";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface BarcodeScannerProps {
	isOpen: boolean;
	onClose: () => void;
	onBarcodeDetected: (_barcodeResults: {
		barcodes: BarcodeResult[];
		usdaProducts: USDAProduct[];
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

interface USDAProduct {
	fdc_id: number;
	description: string;
	data_type: string;
	brand_owner: string;
	ingredients: string;
	gtin_upc: string;
	serving_size: string;
	serving_size_unit: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
	isOpen,
	onClose,
	onBarcodeDetected,
}) => {
	const [isScanning, setIsScanning] = useState(false);
	const [scanResults, setScanResults] = useState<{
		barcodes: BarcodeResult[];
		usdaProducts: USDAProduct[];
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { success, error: showError } = useNotification();

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

			// 3. 查询USDA数据库
			const usdaResults: USDAProduct[] = [];
			
			for (const barcode of foodBarcodes) {
				try {
					const usdaResponse = await imageService.searchUSDAByBarcode(barcode.data);
					if (usdaResponse.success && usdaResponse.data?.usda_results) {
						usdaResults.push(...usdaResponse.data.usda_results);
					}
				} catch (err) {
					console.warn(`USDA查询失败 for barcode ${barcode.data}:`, err);
				}
			}

			setScanResults({
				barcodes: foodBarcodes,
				usdaProducts: usdaResults,
			});

			success(`检测到 ${foodBarcodes.length} 个条形码，找到 ${usdaResults.length} 个USDA产品`);

			// 通知父组件
			onBarcodeDetected({
				barcodes: foodBarcodes,
				usdaProducts: usdaResults,
			});

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "扫描失败";
			setError(errorMessage);
			showError(errorMessage);
			
			// If we got a 503 error, run diagnostics
			if (errorMessage.includes("503") || errorMessage.includes("Service Unavailable")) {
				console.log("503 error detected, running barcode dependency diagnostics...");
				try {
					const debugResponse = await imageService.debugBarcodeDependencies();
					if (debugResponse.success && debugResponse.data) {
						console.log("Barcode Debug Info:", debugResponse.data.debug_info);
						
						const { debug_info } = debugResponse.data;
						if (!debug_info.summary.ready_for_barcode_detection) {
							const errorDetails = debug_info.errors.join(", ");
							showError(`条形码依赖问题: ${errorDetails}`);
						}
					} else {
						console.error("Debug response failed or no data");
					}
				} catch (debugErr) {
					console.error("Debug endpoint also failed:", debugErr);
				}
			}
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

							{/* USDA产品信息 */}
							<div className="usda-section">
								<h5>USDA产品信息 ({scanResults.usdaProducts.length})</h5>
								{scanResults.usdaProducts.length > 0 ? (
									<div className="usda-products">
										{scanResults.usdaProducts.map((product, index) => (
											<div key={index} className="usda-product">
												<h6>{product.description}</h6>
												{product.brand_owner && (
													<p><strong>品牌:</strong> {product.brand_owner}</p>
												)}
												<p><strong>FDC ID:</strong> {product.fdc_id}</p>
												<p><strong>数据类型:</strong> {product.data_type}</p>
												{product.serving_size && (
													<p><strong>建议份量:</strong> {product.serving_size} {product.serving_size_unit}</p>
												)}
											</div>
										))}
									</div>
								) : (
									<p className="no-usda-data">未找到对应的USDA营养数据</p>
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
					background: #28a745;
					color: white;
					padding: 0.25rem 0.5rem;
					border-radius: 4px;
					font-size: 0.8rem;
					font-weight: bold;
				}

				.usda-products {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.usda-product {
					background: white;
					border: 1px solid #e9ecef;
					border-radius: 8px;
					padding: 1rem;
				}

				.usda-product h6 {
					margin: 0 0 0.5rem 0;
					color: #2c3e50;
					font-size: 1rem;
				}

				.usda-product p {
					margin: 0.25rem 0;
					font-size: 0.9rem;
					color: #6c757d;
				}

				.no-usda-data {
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