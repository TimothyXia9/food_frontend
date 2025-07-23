import React, { useState, useRef } from "react";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface ImageUploadProps {
	onImageUploaded: (imageId: number, results: any) => void;
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

			// 步骤2: 开始图片分析
			const analyzeResponse = await imageService.analyzeImage(imageId, "full");
			
			if (!analyzeResponse.success) {
				throw new Error("启动图片分析失败");
			}

			info("正在分析图片中的食物...");

			// 步骤3: 轮询获取分析结果
			let attempts = 0;
			const maxAttempts = 30; // 最多等待30次，每次2秒 = 60秒
			
			const pollResults = async (): Promise<void> => {
				try {
					const resultsResponse = await imageService.getImageResults(imageId);
					
					if (resultsResponse.success && resultsResponse.data) {
						const data = resultsResponse.data;
						
						if (data.processing_status === "completed") {
							success("图片分析完成！");
							setAnalyzing(false);
							onUploadEnd?.();
							onImageUploaded(imageId, data);
							return;
						} else if (data.processing_status === "failed") {
							throw new Error("图片分析失败");
						} else if (data.processing_status === "processing" || data.processing_status === "pending") {
							attempts++;
							if (attempts < maxAttempts) {
								setTimeout(pollResults, 2000); // 2秒后重试
								return;
							} else {
								throw new Error("图片分析超时，请稍后重试");
							}
						}
					}
					
					throw new Error("获取分析结果失败");
				} catch (error) {
					console.error("轮询结果失败:", error);
					throw error;
				}
			};

			await pollResults();

		} catch (err) {
			console.error("图片上传分析失败:", err);
			error(
				err instanceof Error ? err.message : "图片处理失败，请重试"
			);
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