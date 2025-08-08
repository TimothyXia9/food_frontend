import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface LoginPageProps {
	onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
	const { login, register } = useAuth();
	const [isLogin, setIsLogin] = React.useState(true);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [formData, setFormData] = React.useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
		nickname: "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) setError(null);
	};

	const validateForm = () => {
		if (!formData.username.trim()) {
			setError("请输入用户名");
			return false;
		}
		if (!formData.password.trim()) {
			setError("请输入密码");
			return false;
		}
		if (formData.password.length < 8) {
			setError("密码至少需要8个字符");
			return false;
		}

		if (!isLogin) {
			if (!formData.email.trim()) {
				setError("请输入邮箱地址");
				return false;
			}
			if (!/\S+@\S+\.\S+/.test(formData.email)) {
				setError("请输入有效的邮箱地址");
				return false;
			}
			if (!formData.nickname.trim()) {
				setError("请输入昵称");
				return false;
			}
			if (formData.password !== formData.confirmPassword) {
				setError("两次输入的密码不一致");
				return false;
			}
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);
		setError(null);

		try {
			let success = false;

			if (isLogin) {
				// 登录
				success = await login({
					username: formData.username,
					password: formData.password,
				});

				if (!success) {
					setError("登录失败，请检查用户名和密码");
				}
			} else {
				// 注册
				success = await register({
					username: formData.username,
					email: formData.email,
					password: formData.password,
					nickname: formData.nickname,
				});

				if (!success) {
					setError("注册失败，用户名或邮箱可能已存在");
				}
			}

			if (success) {
				console.log(isLogin ? "登录成功" : "注册成功");
				onLogin();
			}
		} catch (error) {
			console.error("认证错误:", error);
			setError("网络错误，请稍后重试");
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<h1 className="login-title">卡路里追踪器</h1>
					<p className="login-subtitle">健康生活，从记录开始</p>
				</div>

				<div className="login-tabs">
					<button
						className={`tab-btn ${isLogin ? "active" : ""}`}
						onClick={() => {
							setIsLogin(true);
							setError(null);
							setFormData({
								username: "",
								email: "",
								password: "",
								confirmPassword: "",
								nickname: "",
							});
						}}
					>
						登录
					</button>
					<button
						className={`tab-btn ${!isLogin ? "active" : ""}`}
						onClick={() => {
							setIsLogin(false);
							setError(null);
							setFormData({
								username: "",
								email: "",
								password: "",
								confirmPassword: "",
								nickname: "",
							});
						}}
					>
						注册
					</button>
				</div>
				<form onSubmit={handleSubmit} className="login-form">
					{error && <div className="error-message">{error}</div>}

					<div className="demo-info">
						<h4>演示账号</h4>
						<p>用户名: testuser | 密码: testpass123</p>
						<p>或者点击"注册"创建新账号</p>
					</div>

					<div className="form-group">
						<label className="form-label">用户名</label>
						<input
							type="text"
							name="username"
							value={formData.username}
							onChange={handleInputChange}
							className="form-input"
							placeholder="请输入用户名"
							required
							disabled={loading}
						/>
					</div>

					{!isLogin && (
						<>
							<div className="form-group">
								<label className="form-label">邮箱地址</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="form-input"
									placeholder="请输入邮箱地址"
									required
									disabled={loading}
								/>
							</div>

							<div className="form-group">
								<label className="form-label">昵称</label>
								<input
									type="text"
									name="nickname"
									value={formData.nickname}
									onChange={handleInputChange}
									className="form-input"
									placeholder="请输入昵称"
									required
									disabled={loading}
								/>
							</div>
						</>
					)}

					<div className="form-group">
						<label className="form-label">密码</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							onChange={handleInputChange}
							className="form-input"
							placeholder={isLogin ? "请输入密码" : "请输入密码 (至少8个字符)"}
							required
							disabled={loading}
						/>
					</div>

					{!isLogin && (
						<div className="form-group">
							<label className="form-label">确认密码</label>
							<input
								type="password"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleInputChange}
								className="form-input"
								placeholder="请再次输入密码"
								required
								disabled={loading}
							/>
						</div>
					)}

					<button
						type="submit"
						className="btn btn-primary login-submit"
						disabled={loading}
					>
						{loading ? "处理中..." : isLogin ? "登录" : "注册"}
					</button>
				</form>
			</div>

			<style>{`
				.login-container {
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

				}

				.login-card {
					background: white;
					border-radius: 12px;
					box-shadow: var(--shadow-heavy);
					padding: 2rem;
					width: 100%;
					max-width: 400px;
				}

				.login-header {
					text-align: center;
					margin-bottom: 2rem;
				}

				.login-title {
					font-size: 2rem;
					color: #2c3e50;
					margin-bottom: 0.5rem;
				}

				.login-subtitle {
					color: #7f8c8d;
					margin: 0;
				}

				.login-tabs {
					display: flex;
					background: #f8f9fa;
					border-radius: 8px;
					padding: 4px;
					margin-bottom: 2rem;
				}

				.tab-btn {
					flex: 1;
					padding: 0.5rem 1rem;
					border: none;
					background: transparent;
					border-radius: 4px;
					cursor: pointer;
					font-size: 1rem;
					transition: all 0.3s;
				}

				.tab-btn.active {
					background: var(--primary-color);
					color: white;
				}

				.login-form {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.login-submit {
					padding: 0.75rem;
					font-size: 1.1rem;
					margin-top: 1rem;
				}

				.login-footer {
					margin-top: 2rem;
					text-align: center;
				}

				.demo-hint {
					color: #7f8c8d;
					font-size: 0.9rem;
					margin: 0;
				}

				.error-message {
					background-color: #fee;
					color: #c33;
					padding: 0.75rem;
					border-radius: 4px;
					border: 1px solid #fcc;
					margin-bottom: 1rem;
					font-size: 0.9rem;
				}

				.form-input:disabled {
					background-color: #f8f9fa;
					cursor: not-allowed;
				}

				.login-submit:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.demo-info {
					background-color: #e8f5e8;
					border: 1px solid #4caf50;
					border-radius: 6px;
					padding: 1rem;
					margin-bottom: 1rem;
				}

				.demo-info h4 {
					margin: 0 0 0.5rem 0;
					color: #2e7d32;
					font-size: 1rem;
				}

				.demo-info p {
					margin: 0.25rem 0;
					font-size: 0.85rem;
					color: #2e7d32;
				}
			`}</style>
		</div>
	);
};
export default LoginPage;
