import React from "react";
interface LoginPageProps {
	onLogin: () => void;
}
const LoginPage = ({ onLogin }: LoginPageProps) => {
	const [isLogin, setIsLogin] = React.useState(true);
	const [formData, setFormData] = React.useState({
		username: "",
		password: "",
		confirmPassword: "",
	});
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev: any) => ({
			...prev,
			[name]: value,
		}));
	};
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		console.log("Form submitted:", formData);
		onLogin();
	};
	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<h1 className="login-title">卡路里追踪器</h1>
					<p className="login-subtitle">健康生活，从记录开始</p>
				</div>

				<div className="login-tabs">
					<button className={`tab-btn ${isLogin ? "active" : ""}`} onClick={() => setIsLogin(true)}>
						登录
					</button>
					<button className={`tab-btn ${!isLogin ? "active" : ""}`} onClick={() => setIsLogin(false)}>
						注册
					</button>
				</div>
				<form onSubmit={handleSubmit} className="login-form">

					<div className="form-group">
						<label className="form-label">用户名</label>
						<input type="text" name="username" value={formData.username} onChange={handleInputChange} className="form-input" placeholder="请输入用户名" required />
					</div>

					<div className="form-group">
						<label className="form-label">密码</label>
						<input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" placeholder="请输入密码" required />
					</div>

					{!isLogin && (
						<div className="form-group">
							<label className="form-label">确认密码</label>
							<input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="form-input" placeholder="请再次输入密码" required />
						</div>
					)}

					<button type="submit" className="btn btn-primary login-submit">
						{isLogin ? "登录" : "注册"}
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
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
					background: #3498db;
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
			`}</style>
		</div>
	);
};
export default LoginPage;
