import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
	const [activeTab, setActiveTab] = useState<"login" | "register">("login");
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		nickname: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login, register } = useAuth();
	const { success: showSuccess, error: showError } = useNotification();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			let success = false;

			if (activeTab === "login") {
				success = await login({
					username: formData.username,
					password: formData.password,
				});
			} else {
				success = await register({
					username: formData.username,
					email: formData.email,
					password: formData.password,
					nickname: formData.nickname,
				});
			}

			if (success) {
				onSuccess?.();
				onClose();
				setFormData({
					username: "",
					email: "",
					password: "",
					nickname: "",
				});
				// Show success notification
				if (activeTab === "login") {
					showSuccess("登录成功！");
				} else {
					showSuccess("注册成功！");
				}
			} else {
				const errorMsg =
					activeTab === "login" ? "登录失败，请检查用户名和密码" : "注册失败，请检查信息";
				setError(errorMsg);
				showError(errorMsg);
			}
		} catch (err) {
			const errorMsg = "网络错误，请稍后重试";
			setError(errorMsg);
			showError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleTabChange = (tab: "login" | "register") => {
		setActiveTab(tab);
		setError("");
		setFormData({
			username: "",
			email: "",
			password: "",
			nickname: "",
		});
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={e => e.stopPropagation()}>
				<div className="modal-header">
					<h2 className="modal-title">{activeTab === "login" ? "登录" : "注册"}</h2>
					<button className="close-button" onClick={onClose}>
						×
					</button>
				</div>

				<div className="tab-container">
					<button
						className={`tab ${activeTab === "login" ? "active" : ""}`}
						onClick={() => handleTabChange("login")}
					>
						登录
					</button>
					<button
						className={`tab ${activeTab === "register" ? "active" : ""}`}
						onClick={() => handleTabChange("register")}
					>
						注册
					</button>
				</div>

				<form className="login-form" onSubmit={handleSubmit}>
					<div className="form-group">
						<label className="form-label" htmlFor="username">
							用户名
						</label>
						<input
							className="form-input"
							id="username"
							name="username"
							type="text"
							value={formData.username}
							onChange={handleInputChange}
							required
						/>
					</div>

					{activeTab === "register" && (
						<>
							<div className="form-group">
								<label className="form-label" htmlFor="email">
									邮箱
								</label>
								<input
									className="form-input"
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleInputChange}
									required
								/>
							</div>

							<div className="form-group">
								<label className="form-label" htmlFor="nickname">
									昵称
								</label>
								<input
									className="form-input"
									id="nickname"
									name="nickname"
									type="text"
									value={formData.nickname}
									onChange={handleInputChange}
									required
								/>
							</div>
						</>
					)}

					<div className="form-group">
						<label className="form-label" htmlFor="password">
							密码
						</label>
						<input
							className="form-input"
							id="password"
							name="password"
							type="password"
							value={formData.password}
							onChange={handleInputChange}
							required
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button className="submit-button" type="submit" disabled={loading}>
						{loading ? "处理中..." : activeTab === "login" ? "登录" : "注册"}
					</button>
				</form>
			</div>

			<style jsx>{`
				.modal-overlay {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-color: rgba(0, 0, 0, 0.5);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 1000;
				}

				.modal-content {
					background: white;
					padding: 2rem;
					border-radius: 8px;
					max-width: 400px;
					width: 90%;
					max-height: 90vh;
					overflow-y: auto;
				}

				.modal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1.5rem;
				}

				.modal-title {
					margin: 0;
					color: #333;
				}

				.close-button {
					background: none;
					border: none;
					font-size: 1.5rem;
					cursor: pointer;
					color: #666;
				}

				.tab-container {
					display: flex;
					margin-bottom: 1.5rem;
					border-bottom: 1px solid #eee;
				}

				.tab {
					flex: 1;
					padding: 0.75rem;
					background: none;
					border: none;
					cursor: pointer;
					border-bottom: 2px solid transparent;
					color: #666;
					font-weight: 400;
				}

				.tab.active {
					border-bottom-color: #007bff;
					color: #007bff;
					font-weight: 600;
				}

				.login-form {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.form-group {
					display: flex;
					flex-direction: column;
				}

				.form-label {
					margin-bottom: 0.25rem;
					font-weight: 500;
					color: #333;
				}

				.form-input {
					padding: 0.75rem;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 1rem;
				}

				.form-input:focus {
					outline: none;
					border-color: #007bff;
					box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
				}

				.submit-button {
					padding: 0.75rem;
					background-color: #007bff;
					color: white;
					border: none;
					border-radius: 4px;
					font-size: 1rem;
					cursor: pointer;
				}

				.submit-button:hover {
					background-color: #0056b3;
				}

				.submit-button:disabled {
					background-color: #ccc;
					cursor: not-allowed;
				}

				.error-message {
					color: #dc3545;
					font-size: 0.875rem;
					margin-top: 0.25rem;
				}
			`}</style>
		</div>
	);
};

export default LoginModal;
