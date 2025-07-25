import React, { useState, useRef } from "react";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface ImageUploadProps {
	onImageUploaded: (imageId: number, results: any, imagePreview?: string) => void;
	onImagePreview?: (imagePreview: string) => void;
	onStreamingProgress?: (data: {
		step: string;
		message?: string;
		progress?: number;
		foods?: any[];
		portions?: any[];
	}) => void;
	onUploadStart?: () => void;
	onUploadEnd?: () => void;
	disabled?: boolean;
	useStreaming?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
	onImageUploaded,
	onImagePreview,
	onStreamingProgress,
	onUploadStart,
	onUploadEnd,
	disabled = false,
	useStreaming = true,
}) => {
	const [uploading, setUploading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const { success, error, info } = useNotification();

	const handleFileSelect = () => {
		if (disabled || uploading || analyzing) return;
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// 验证文件类型
		if (!file.type.startsWith("image/")) {
			error("请选择图片文件");
			return;
		}

		// 验证文件大小 (10MB)
		if (file.size > 10 * 1024 * 1024) {
			error("图片文件大小不能超过10MB");
			return;
		}

		// 创建图片预览URL并立即显示
		const imagePreviewUrl = URL.createObjectURL(file);
		onImagePreview?.(imagePreviewUrl);

		try {
			setUploading(true);
			onUploadStart?.();

			// 步骤1: 上传图片
			info("正在上传图片...");
			const uploadResponse = await imageService.uploadImage(file);
			
			if (!uploadResponse.success || !uploadResponse.data) {
				throw new Error("图片上传失败");
			}

			const imageId = uploadResponse.data.id;
			success("图片上传成功，开始分析...");

			setUploading(false);
			setAnalyzing(true);

			if (useStreaming) {
				// 使用流式分析
				info("开始分析图片...");
				
				// 创建取消控制器
				abortControllerRef.current = new AbortController();
				
				const streamResult = await imageService.analyzeImageStreaming(
					imageId, 
					(data) => {
						// 处理流式进度更新
						if (data.message) {
							info(data.message);
						}
						
						onStreamingProgress?.(data);
					},
					abortControllerRef.current
				);

				if (streamResult.cancelled) {
					info("图片分析已取消");
					return; // 直接返回，不抛出错误
				} else if (streamResult.success && streamResult.finalResult) {
					success("图片分析完成！");
					setAnalyzing(false);
					onUploadEnd?.();
					
					// 使用流式分析的结果
					const finalData = streamResult.finalResult;
					const mockResults = {
						image_id: imageId,
						processing_status: "completed" as const,
						streaming_result: finalData,
						// 保持向后兼容性
						keywords: finalData.stage_1?.food_types?.map((food: any) => food.name) || [],
						results: finalData.stage_1?.food_types?.map((food: any, index: number) => {
							// 找到对应的分量信息
							const portionInfo = finalData.stage_2?.food_portions?.find((portion: any) => 
								portion.name === food.name
							);
							
							return {
								id: index + 1,
								food: {
									id: index + 1,
									name: food.name,
									confidence: food.confidence,
									estimated_grams: portionInfo?.estimated_grams || 100,
									cooking_method: portionInfo?.cooking_method || "",
									portion_description: portionInfo?.portion_description || `约${portionInfo?.estimated_grams || 100}克`,
									calories_per_100g: 100, // 模拟数据
									protein_per_100g: 10,
									fat_per_100g: 5,
									carbs_per_100g: 20,
									fiber_per_100g: 2,
									sugar_per_100g: 5,
									sodium_per_100g: 100,
									serving_size: portionInfo?.estimated_grams || 100,
									is_custom: false
								}
							};
						}) || []
					};
					
					onImageUploaded(imageId, mockResults, imagePreviewUrl);
				} else {
					throw new Error(streamResult.error || "流式分析失败");
				}
			} else {
				// 使用传统分析方式（向后兼容）
				info("正在分析图片中的食物...");
				const analyzeResponse = await imageService.analyzeImage(imageId);
				
				if (!analyzeResponse.success || !analyzeResponse.data) {
					throw new Error("图片分析失败");
				}

				const data = analyzeResponse.data;
				if (data.status === "completed" && data.keywords && data.keywords.length > 0) {
					success("图片分析完成！");
					setAnalyzing(false);
					onUploadEnd?.();
					
					// 将关键词转换为模拟的识别结果格式
					const mockResults = {
						image_id: imageId,
						processing_status: "completed" as const,
						keywords: data.keywords,
						results: data.keywords.map((keyword: string, index: number) => ({
							id: index + 1,
							food: {
								id: index + 1,
								name: keyword,
								calories_per_100g: 100, // 模拟数据
								protein_per_100g: 10,
								fat_per_100g: 5,
								carbs_per_100g: 20,
								fiber_per_100g: 2,
								sugar_per_100g: 5,
								sodium_per_100g: 100,
								serving_size: 100,
								is_custom: false
							}
						}))
					};
					
					onImageUploaded(imageId, mockResults, imagePreviewUrl);
				} else {
					throw new Error("未能识别到食物关键词");
				}
			}

		} catch (err) {
			console.error("图片上传分析失败:", err);
			error(
				err instanceof Error ? err.message : "图片处理失败，请重试"
			);
			// 清理预览URL
			URL.revokeObjectURL(imagePreviewUrl);
		} finally {
			setUploading(false);
			setAnalyzing(false);
			onUploadEnd?.();
			
			// 清理取消控制器
			abortControllerRef.current = null;
			
			// 清空文件输入
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleCancel = () => {
		if (abortControllerRef.current && analyzing) {
			abortControllerRef.current.abort();
			info("正在取消分析...");
		}
	};

	const isProcessing = uploading || analyzing;
	const buttonText = uploading 
		? "上传中..." 
		: analyzing 
			? "分析中..." 
			: "📸 拍照识别";

	return (
		<div className="image-upload">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="image/*"
				style={{ display: "none" }}
			/>
			<div className="upload-buttons">
				<button
					className={`btn btn-warning ${isProcessing ? "processing" : ""}`}
					onClick={handleFileSelect}
					disabled={disabled || isProcessing}
				>
					{buttonText}
				</button>
				
				{analyzing && (
					<button
						className="btn btn-secondary cancel-btn"
						onClick={handleCancel}
						title="取消分析"
					>
						❌ 取消
					</button>
				)}
			</div>
			
			<style>{`
				.image-upload .upload-buttons {
					display: flex;
					gap: 10px;
					align-items: center;
				}
				
				.image-upload .btn.processing {
					opacity: 0.7;
					cursor: not-allowed;
				}
				
				.image-upload .btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				
				.image-upload .cancel-btn {
					background-color: #6c757d;
					border-color: #6c757d;
					color: white;
					padding: 8px 12px;
					font-size: 14px;
					border-radius: 4px;
					transition: all 0.2s;
				}
				
				.image-upload .cancel-btn:hover {
					background-color: #5a6268;
					border-color: #545b62;
					transform: translateY(-1px);
				}
			`}</style>
		</div>
	);
};

export default ImageUpload;