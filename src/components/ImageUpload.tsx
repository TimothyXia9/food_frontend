import React, { useState, useRef } from "react";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface ImageUploadProps {
	onImageUploaded: (imageId: number, results: any, imagePreview?: string) => void;
	onUploadStart?: () => void;
	onUploadEnd?: () => void;
	disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
	onImageUploaded,
	onUploadStart,
	onUploadEnd,
	disabled = false,
}) => {
	const [uploading, setUploading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
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

		// 创建图片预览URL
		const imagePreviewUrl = URL.createObjectURL(file);

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

			// 步骤2: 分析获取食物关键词
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
			
			// 清空文件输入
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
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
			<button
				className={`btn btn-warning ${isProcessing ? "processing" : ""}`}
				onClick={handleFileSelect}
				disabled={disabled || isProcessing}
			>
				{buttonText}
			</button>
			
			<style>{`
				.image-upload .btn.processing {
					opacity: 0.7;
					cursor: not-allowed;
				}
				
				.image-upload .btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
			`}</style>
		</div>
	);
};

export default ImageUpload;