import React from "react";
import { useTranslation } from "react-i18next";

interface FoodSearchToolbarProps {
	viewMode: "search" | "user";
	searchQuery: string;
	loading: boolean;
	userFoodsLoading: boolean;
	isAuthenticated: boolean;
	onViewModeChange: (mode: "search" | "user") => void;
	onSearchQueryChange: (query: string) => void;
	onSearch: () => void;
	onCreateCustomFood: () => void;
	onCameraCapture: () => void;
	onBarcodeCapture?: () => void;
	onLoginRequired: () => void;
}

const FoodSearchToolbar: React.FC<FoodSearchToolbarProps> = ({
	viewMode,
	searchQuery,
	loading,
	userFoodsLoading,
	isAuthenticated,
	onViewModeChange,
	onSearchQueryChange,
	onSearch,
	onCreateCustomFood,
	onCameraCapture,
	onBarcodeCapture,
	onLoginRequired,
}) => {
	const { t } = useTranslation();
	return (
		<div className="food-search-toolbar">
			{/* Mode Selector */}
			<div className="view-mode-selector">
				<button
					onClick={() => onViewModeChange("search")}
					className={`view-mode-btn ${viewMode === "search" ? "active" : ""}`}
				>
					{t("foodSearchToolbar.searchFood")}
				</button>
				<button
					onClick={() => onViewModeChange("user")}
					className={`view-mode-btn ${viewMode === "user" ? "active" : ""}`}
					disabled={!isAuthenticated}
				>
					{t("foodSearchToolbar.myFood")}
				</button>
			</div>

			{/* Search Area */}
			{viewMode === "search" && (
				<div className="search-section">
					<div className="search-bar">
						<input
							type="text"
							value={searchQuery}
							onChange={e => onSearchQueryChange(e.target.value)}
							placeholder={t("foodSearchToolbar.searchPlaceholder")}
							className="search-input"
							onKeyPress={e => e.key === "Enter" && onSearch()}
							disabled={loading}
						/>
						<button
							onClick={onSearch}
							className="btn btn-primary search-btn"
							disabled={loading}
						>
							{loading
								? t("foodSearchToolbar.searching")
								: t("foodSearchToolbar.search")}
						</button>
						<button
							className="btn btn-warning"
							onClick={() =>
								isAuthenticated ? onCameraCapture() : onLoginRequired()
							}
						>
							{t("foodSearchToolbar.photoRecognition")}
						</button>
						{onBarcodeCapture && (
							<button
								className="btn btn-info"
								onClick={() =>
									isAuthenticated ? onBarcodeCapture() : onLoginRequired()
								}
							>
								{t("foodSearchToolbar.barcodeRecognition")}
							</button>
						)}
					</div>

					{/* <div className="search-actions">
						<button
							onClick={() => {
								if (isAuthenticated) {
									onCreateCustomFood();
								} else {
									onLoginRequired();
								}
							}}
							className="btn btn-success"
						>
							{t("foodSearchToolbar.createCustomFood")}
						</button>

					</div> */}
				</div>
			)}

			{/* My Food Area */}
			{viewMode === "user" && (
				<div className="user-foods-section">
					<div className="user-foods-header">
						<h3>{t("foodSearchToolbar.myCustomFood")}</h3>
						<button
							onClick={() => {
								if (isAuthenticated) {
									onCreateCustomFood();
								} else {
									onLoginRequired();
								}
							}}
							className="btn btn-success"
							disabled={userFoodsLoading}
						>
							{t("foodSearchToolbar.createCustomFood")}
						</button>
					</div>
				</div>
			)}

			<style>{`
				.food-search-toolbar {
					flex-shrink: 0;
					background: white;
					border-bottom: 2px solid #e9ecef;
					padding: 0.5rem;
					box-shadow: var(--shadow-notification);
				}

				.view-mode-selector {
					display: flex;
					gap: 0.5rem;
					margin-bottom: 0.5rem;
					border-radius: 8px;
					background: #f8f9fa;
					padding: 0.5rem;
				}
				
				.view-mode-btn {
					flex: 1;
					padding: 0.75rem 1.5rem;
					border: none;
					border-radius: 6px;
					background: transparent;
					color: #6c757d;
					cursor: pointer;
					transition: all 0.3s;
					font-weight: 500;
				}
				
				.view-mode-btn:hover:not(:disabled) {
					background: #e9ecef;
					color: #495057;
				}
				
				.view-mode-btn.active {
					background: #007bff;
					color: white;
				}
				
				.view-mode-btn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.search-section, .user-foods-section {
					background: #f8f9fa;
					border-radius: 8px;
					padding: 0.5rem;
				}

				.search-bar {
					display: flex;
					gap: 1rem;
				}

				.search-input {
					flex: 1;
					padding: 0.75rem;
					border: 2px solid #dee2e6;
					border-radius: 8px;
					font-size: 1rem;
					background: white;
					transition: all 0.3s ease;
				}

				.search-input:focus {
					outline: none;
					border-color: var(--primary-color);
					box-shadow: var(--shadow-focus);
				}

				.search-btn {
					padding: 0.75rem 1.5rem;
					white-space: nowrap;
					border-radius: 8px;
					font-weight: 500;
				}

				.search-actions {
					display: flex;
					gap: 1rem;
				}

				.search-actions button {
					flex: 1;
					padding: 0.75rem 1rem;
					border-radius: 8px;
					font-weight: 500;
					transition: all 0.3s ease;
				}

				.user-foods-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				
				.user-foods-header h3 {
					margin: 0;
					color: #2c3e50;
				}

				.user-foods-header button {
					padding: 0.75rem 1rem;
					border-radius: 8px;
					font-weight: 500;
				}

				@media (max-width: 768px) {
					.food-search-toolbar {
						padding: 0.75rem;
					}
					
					.search-bar {
						flex-direction: column;
						gap: 0.75rem;
					}

					.search-actions {
						flex-direction: column;
						gap: 0.75rem;
					}

					.user-foods-header {
						flex-direction: column;
						gap: 0.75rem;
						align-items: stretch;
					}

					.user-foods-header button {
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
};

export default FoodSearchToolbar;
