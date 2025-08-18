import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { imageService } from "../services/imageService";
import { useNotification } from "../contexts/NotificationContext";

interface ImageUploadProps {
	onImageUploaded: (
		imageId: number,
		results: any,
		imagePreview?: string
	) => void;
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
	const { t } = useTranslation();
	const [uploading, setUploading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const { showSuccess, showError, showInfo } = useNotification();

	const handleFileSelect = () => {
		if (disabled || uploading || analyzing) return;
		fileInputRef.current?.click();
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// {t("photoRecognition.validatingFile")}
		if (!file.type.startsWith("image/")) {
			showError(t("photoRecognition.selectImageFile"));
			return;
		}

		// {t("photoRecognition.validatingSize")}
		if (file.size > 10 * 1024 * 1024) {
			showError(t("photoRecognition.fileSizeExceeded"));
			return;
		}

		// Create image preview URL and display immediately
		const imagePreviewUrl = URL.createObjectURL(file);
		onImagePreview?.(imagePreviewUrl);

		try {
			setUploading(true);
			onUploadStart?.();

			// Step 1: Upload image
			showInfo(t("photoRecognition.uploadingImage"));
			const uploadResponse = await imageService.uploadImage(file);

			if (!uploadResponse.success || !uploadResponse.data) {
				throw new Error(t("photoRecognition.uploadFailed"));
			}

			const imageId = uploadResponse.data.id;
			showSuccess(t("photoRecognition.uploadSuccess"));

			setUploading(false);
			setAnalyzing(true);

			if (useStreaming) {
				// Create abort controller
				abortControllerRef.current = new AbortController();

				const streamResult = await imageService.analyzeImageStreaming(
					imageId,
					data => {
						// Handle streaming progress updates
						if (data.message) {
							showInfo(data.message);
						}

						onStreamingProgress?.(data);
					},
					abortControllerRef.current
				);

				if (streamResult.cancelled) {
					showInfo(t("photoRecognition.analysisCancelled"));
					return; // Return directly, don't throw error
				} else if (streamResult.success && streamResult.finalResult) {
					showSuccess(t("photoRecognition.analysisComplete"));
					setAnalyzing(false);
					onUploadEnd?.();

					// Use streaming analysis results
					const finalData = streamResult.finalResult;
					const mockResults = {
						image_id: imageId,
						processing_status: "completed" as const,
						streaming_result: finalData,
						// Maintain backward compatibility
						keywords:
							finalData.stage_1?.food_types?.map((food: any) => food.name) || [],
						results:
							finalData.stage_1?.food_types?.map((food: any, index: number) => {
								// Find corresponding portion information
								const portionInfo = finalData.stage_2?.food_portions?.find(
									(portion: any) => portion.name === food.name
								);

								return {
									id: index + 1,
									food: {
										id: index + 1,
										name: food.name,
										confidence: food.confidence,
										estimated_grams: portionInfo?.estimated_grams || 100,
										cooking_method: portionInfo?.cooking_method || "",
										portion_description:
											portionInfo?.portion_description ||
											`${t("photoRecognition.about")}${portionInfo?.estimated_grams || 100}${t("photoRecognition.grams")}`,
										calories_per_100g: 100, // Simulated data
										protein_per_100g: 10,
										fat_per_100g: 5,
										carbs_per_100g: 20,
										fiber_per_100g: 2,
										sugar_per_100g: 5,
										sodium_per_100g: 100,
										serving_size: portionInfo?.estimated_grams || 100,
										is_custom: false,
									},
								};
							}) || [],
					};

					onImageUploaded(imageId, mockResults, imagePreviewUrl);
				} else {
					throw new Error(
						streamResult.error || t("photoRecognition.streamAnalysisFailed")
					);
				}
			} else {
				// Use traditional analysis method (backward compatibility)
				showInfo(t("photoRecognition.analyzingImage"));
				const analyzeResponse = await imageService.analyzeImage(imageId);

				if (!analyzeResponse.success || !analyzeResponse.data) {
					throw new Error(t("photoRecognition.analysisFailed"));
				}

				const data = analyzeResponse.data;
				if (
					data.status === "completed" &&
					data.keywords &&
					data.keywords.length > 0
				) {
					showSuccess(t("photoRecognition.analysisComplete"));
					setAnalyzing(false);
					onUploadEnd?.();

					// Convert keywords to simulated recognition result format
					const mockResults = {
						image_id: imageId,
						processing_status: "completed" as const,
						keywords: data.keywords,
						results: data.keywords.map((keyword: string, index: number) => ({
							id: index + 1,
							food: {
								id: index + 1,
								name: keyword,
								calories_per_100g: 100, // Simulated data
								protein_per_100g: 10,
								fat_per_100g: 5,
								carbs_per_100g: 20,
								fiber_per_100g: 2,
								sugar_per_100g: 5,
								sodium_per_100g: 100,
								serving_size: 100,
								is_custom: false,
							},
						})),
					};

					onImageUploaded(imageId, mockResults, imagePreviewUrl);
				} else {
					throw new Error(t("photoRecognition.noFoodKeywords"));
				}
			}
		} catch (err) {
			console.error("Image upload analysis failed:", err);
			showError(
				err instanceof Error ? err.message : t("photoRecognition.processingFailed")
			);
			// Clean up preview URL
			URL.revokeObjectURL(imagePreviewUrl);
		} finally {
			setUploading(false);
			setAnalyzing(false);
			onUploadEnd?.();

			// Clean up abort controller
			abortControllerRef.current = null;

			// Clear file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleCancel = () => {
		if (abortControllerRef.current && analyzing) {
			abortControllerRef.current.abort();
			showInfo(t("photoRecognition.cancellingAnalysis"));
		}
	};

	const isProcessing = uploading || analyzing;
	const buttonText = uploading
		? t("foodSearchToolbar.uploading")
		: analyzing
			? t("photoRecognition.analyzing")
			: t("photoRecognition.capture");

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
						title={t("photoRecognition.cancelTitle")}
					>
						{t("photoRecognition.cancel")}
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
