import React from "react";
import { userService } from "../services";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

interface ProfileProps {
	onLoginRequired: () => void;
}

const Profile = ({ onLoginRequired }: ProfileProps) => {
	const { isAuthenticated } = useAuth();
	const { success } = useNotification();
	const [isEditing, setIsEditing] = React.useState(false);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [profile, setProfile] = React.useState({
		username: "",
		email: "",
		date_of_birth: "",
		gender: "Male",
		height: 175,
		weight: 70,
		daily_calorie_goal: 2000,
	});
	const [editProfile, setEditProfile] = React.useState({ ...profile });

	// Load profile data on component mount
	React.useEffect(() => {
		if (isAuthenticated) {
			loadProfile();
		} else {
			setLoading(false);
		}
	}, [isAuthenticated]);

	const loadProfile = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await userService.getProfile();

			if (response.success && response.data) {
				const profileData = {
					username: response.data.user.username,
					email: response.data.user.email,
					date_of_birth: response.data.profile.date_of_birth || "",
					gender: response.data.profile.gender || "Male",
					height: response.data.profile.height || 175,
					weight: response.data.profile.weight || 70,
					daily_calorie_goal: response.data.profile.daily_calorie_goal || 2000,
				};
				setProfile(profileData);
				setEditProfile(profileData);
			}
		} catch (err) {
			setError("加载用户资料失败");
			console.error("Failed to load profile:", err);
			// Use fallback data for demo
			const fallbackProfile = {
				username: "Demo User",
				email: "demo@example.com",
				date_of_birth: "1990-01-01",
				gender: "Male",
				height: 175,
				weight: 70,
				daily_calorie_goal: 2000,
			};
			setProfile(fallbackProfile);
			setEditProfile(fallbackProfile);
		} finally {
			setLoading(false);
		}
	};
	const handleSave = async () => {
		try {
			setSaving(true);
			setError(null);

			const updateData = {
				nickname: editProfile.username,
				date_of_birth: editProfile.date_of_birth,
				gender: editProfile.gender,
				height: editProfile.height,
				weight: editProfile.weight,
				daily_calorie_goal: editProfile.daily_calorie_goal,
			};

			const response = await userService.updateProfile(updateData);

			if (response.success) {
				setProfile({ ...editProfile });
				setIsEditing(false);
				success("个人资料已更新！");
			} else {
				throw new Error(response.error?.message || "更新失败");
			}
		} catch (err) {
			setError("更新用户资料失败");
			console.error("Failed to update profile:", err);
			// For demo purposes, still update locally
			setProfile({ ...editProfile });
			setIsEditing(false);
			success("个人资料已更新！(演示模式)");
		} finally {
			setSaving(false);
		}
	};
	const handleCancel = () => {
		setEditProfile({ ...profile });
		setIsEditing(false);
	};
	const calculateBMI = () => {
		const heightInM = profile.height / 100;
		const bmi = profile.weight / (heightInM * heightInM);
		return bmi.toFixed(1);
	};
	const getBMICategory = (bmi: number) => {
		if (bmi < 18.5) return { category: "偏瘦", color: "#3498db" };
		if (bmi < 25) return { category: "正常", color: "#2ecc71" };
		if (bmi < 30) return { category: "超重", color: "#f39d12" };
		return { category: "肥胖", color: "#e74c3c" };
	};
	const calculateAge = () => {
		const today = new Date();
		const birthDate = new Date(profile.date_of_birth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};
	const bmi = parseFloat(calculateBMI());
	const bmiInfo = getBMICategory(bmi);
	const age = calculateAge();
	if (loading) {
		return (
			<div className="profile">
				<div className="loading-container">
					<div className="loading-spinner"></div>
					<p>加载用户资料中...</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="profile">
				<div className="not-authenticated">
					<h2>查看个人资料</h2>
					<p>请先登录以查看和编辑您的个人资料</p>
					<button onClick={onLoginRequired} className="btn btn-primary">
						登录
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="profile">
			<div className="profile-header">
				<h1>个人资料</h1>
				{error && (
					<div className="error-message">
						⚠️ {error}
						<button onClick={loadProfile} className="btn btn-small btn-primary">
							重试
						</button>
					</div>
				)}
				<button
					onClick={() => setIsEditing(!isEditing)}
					className={`btn ${isEditing ? "btn-secondary" : "btn-primary"}`}
					disabled={saving}
				>
					{isEditing ? "取消编辑" : "编辑资料"}
				</button>
			</div>
			<div className="profile-grid">
				{/* 基本信息卡片 */}
				<div className="card profile-info">
					<div className="card-header">
						<h3 className="card-title">基本信息</h3>
					</div>

					{isEditing ? (
						<div className="edit-form">
							<div className="form-group">
								<label className="form-label">用户名</label>
								<input
									type="text"
									value={editProfile.username}
									onChange={e =>
										setEditProfile({ ...editProfile, username: e.target.value })
									}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">邮箱</label>
								<input
									type="email"
									value={editProfile.email}
									onChange={e =>
										setEditProfile({ ...editProfile, email: e.target.value })
									}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">出生日期</label>
								<input
									type="date"
									value={editProfile.date_of_birth}
									onChange={e =>
										setEditProfile({
											...editProfile,
											date_of_birth: e.target.value,
										})
									}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">性别</label>
								<select
									value={editProfile.gender}
									onChange={e =>
										setEditProfile({ ...editProfile, gender: e.target.value })
									}
									className="form-input"
								>
									<option value="Male">男</option>
									<option value="Female">女</option>
									<option value="Other">其他</option>
								</select>
							</div>

							<div className="form-actions">
								<button
									onClick={handleCancel}
									className="btn btn-secondary"
									disabled={saving}
								>
									取消
								</button>
								<button
									onClick={handleSave}
									className="btn btn-primary"
									disabled={saving}
								>
									{saving ? "保存中..." : "保存"}
								</button>
							</div>
						</div>
					) : (
						<div className="info-display">
							<div className="info-item">
								<span className="info-label">用户名</span>
								<span className="info-value">{profile.username}</span>
							</div>

							<div className="info-item">
								<span className="info-label">年龄</span>
								<span className="info-value">{age} 岁</span>
							</div>
							<div className="info-item">
								<span className="info-label">性别</span>
								<span className="info-value">
									{profile.gender === "Male"
										? "男"
										: profile.gender === "Female"
											? "女"
											: "其他"}
								</span>
							</div>
						</div>
					)}
				</div>
				{/* 身体数据卡片 */}
				<div className="card body-stats">
					<div className="card-header">
						<h3 className="card-title">身体数据</h3>
					</div>

					{isEditing ? (
						<div className="edit-form">
							<div className="form-group">
								<label className="form-label">身高 (cm)</label>
								<input
									type="number"
									value={editProfile.height}
									onChange={e =>
										setEditProfile({
											...editProfile,
											height: Number(e.target.value),
										})
									}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">体重 (kg)</label>
								<input
									type="number"
									step="0.1"
									value={editProfile.weight}
									onChange={e =>
										setEditProfile({
											...editProfile,
											weight: Number(e.target.value),
										})
									}
									className="form-input"
								/>
							</div>

							<div className="form-group">
								<label className="form-label">每日卡路里目标</label>
								<input
									type="number"
									value={editProfile.daily_calorie_goal}
									onChange={e =>
										setEditProfile({
											...editProfile,
											daily_calorie_goal: Number(e.target.value),
										})
									}
									className="form-input"
								/>
							</div>
						</div>
					) : (
						<div className="body-stats-display">
							<div className="stat-grid">
								<div className="stat-item">
									<div className="stat-icon">📏</div>
									<div className="stat-info">
										<span className="stat-value">{profile.height}</span>
										<span className="stat-unit">cm</span>
									</div>
								</div>

								<div className="stat-item">
									<div className="stat-icon">⚖️</div>
									<div className="stat-info">
										<span className="stat-value">{profile.weight}</span>
										<span className="stat-unit">kg</span>
									</div>
								</div>

								<div className="stat-item">
									<div className="stat-icon">🎯</div>
									<div className="stat-info">
										<span className="stat-value">
											{profile.daily_calorie_goal}
										</span>
										<span className="stat-unit">kcal</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
				{/* BMI 卡片 */}
				<div className="card bmi-card">
					<div className="card-header">
						<h3 className="card-title">BMI 指数</h3>
					</div>

					<div className="bmi-display">
						<div className="bmi-value">
							<span className="bmi-number" style={{ color: bmiInfo.color }}>
								{calculateBMI()}
							</span>
							<span className="bmi-category" style={{ color: bmiInfo.color }}>
								{bmiInfo.category}
							</span>
						</div>

						<div className="bmi-scale">
							<div className="scale-item">
								<div
									className="scale-color"
									style={{ backgroundColor: "#3498db" }}
								></div>
								<span>偏瘦 (&lt;18.5)</span>
							</div>
							<div className="scale-item">
								<div
									className="scale-color"
									style={{ backgroundColor: "#2ecc71" }}
								></div>
								<span>正常 (18.5-24.9)</span>
							</div>
							<div className="scale-item">
								<div
									className="scale-color"
									style={{ backgroundColor: "#f39c12" }}
								></div>
								<span>超重 (25-29.9)</span>
							</div>
							<div className="scale-item">
								<div
									className="scale-color"
									style={{ backgroundColor: "#e74c3c" }}
								></div>
								<span>肥胖 (≥30)</span>
							</div>
						</div>
					</div>
				</div>
				{/* 账户设置卡片 */}
				<div className="card account-settings">
					<div className="card-header">
						<h3 className="card-title">账户设置</h3>
					</div>

					<div className="settings-list">
						<div className="setting-item">
							<span className="setting-label">修改密码</span>
							<button className="btn btn-secondary setting-btn">修改</button>
						</div>

						<div className="setting-item">
							<span className="setting-label">导出数据</span>
							<button className="btn btn-secondary setting-btn">导出</button>
						</div>

						<div className="setting-item">
							<span className="setting-label">删除账户</span>
							<button className="btn btn-danger setting-btn">删除</button>
						</div>
					</div>
				</div>
			</div>
			<style>{`
				.not-authenticated {
					text-align: center;
					padding: 3rem;
					background: white;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
				}

				.not-authenticated h2 {
					margin-bottom: 1rem;
					color: #2c3e50;
				}

				.not-authenticated p {
					margin-bottom: 2rem;
					color: #7f8c8d;
				}

				.loading-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					min-height: 400px;
					text-align: center;
				}

				.loading-spinner {
					width: 40px;
					height: 40px;
					border: 4px solid #f3f3f3;
					border-top: 4px solid #007bff;
					border-radius: 50%;
					animation: spin 1s linear infinite;
					margin-bottom: 1rem;
				}

				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}

				.error-message {
					display: flex;
					align-items: center;
					gap: 1rem;
					padding: 0.75rem 1rem;
					background: #f8d7da;
					border: 1px solid #f5c6cb;
					border-radius: 4px;
					color: #721c24;
					margin-bottom: 1rem;
				}

				.btn-small {
					padding: 0.25rem 0.5rem;
					font-size: 0.8rem;
				}

				.card {
					min-width: 0;
					width: 100%;
					box-sizing: border-box;
				}

				.profile {
					max-width: 1000px;
					margin: 0 auto;
				}

				.profile-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 2rem;
				}

				.profile-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 1.5rem;
				}

				.profile-info {
					grid-column: span 2;
				}

				.info-display {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.info-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem 0;
					border-bottom: 1px solid #f0f0f0;
				}

				.info-label {
					font-weight: 500;
					color: #7f8c8d;
				}

				.info-value {
					font-weight: 600;
					color: #2c3e50;
				}

				.edit-form {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.form-actions {
					display: flex;
					gap: 1rem;
					justify-content: flex-end;
					margin-top: 1rem;
				}

				.body-stats-display {
					padding: 1rem 0;
				}

				.stat-grid {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 1rem;
					width: 100%;
					box-sizing: border-box;
				}

				.stat-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 8px;
					text-align: center;
					min-width: 0; 
					overflow: hidden;
				}

				.stat-icon {
					font-size: 2rem;
					margin-bottom: 0.5rem;
				}

				.stat-info {
					display: flex;
					align-items: baseline;
					gap: 0.25rem;
				}

				.stat-value {
					font-size: 1.5rem;
					font-weight: bold;
					color: #2c3e50;
				}

				.stat-unit {
					font-size: 0.9rem;
					color: #7f8c8d;
				}

				.bmi-display {
					text-align: center;
					padding: 1rem 0;
				}

				.bmi-value {
					margin-bottom: 1.5rem;
				}

				.bmi-number {
					font-size: 3rem;
					font-weight: bold;
					display: block;
					margin-bottom: 0.5rem;
				}

				.bmi-category {
					font-size: 1.2rem;
					font-weight: 600;
				}

				.bmi-scale {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.scale-item {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					font-size: 0.9rem;
				}

				.scale-color {
					width: 20px;
					height: 20px;
					border-radius: 50%;
				}

				.settings-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.setting-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 1rem;
					background: #f8f9fa;
					border-radius: 6px;
				}

				.setting-label {
					font-weight: 500;
					color: #2c3e50;
				}

				.setting-btn {
					padding: 0.5rem 1rem;
					font-size: 0.9rem;
				}

				@media (max-width: 768px) {
					.profile-header {
						flex-direction: column;
						gap: 1rem;
						align-items: flex-start;
					}

					.profile-grid {
						grid-template-columns: 1fr;
					}

					.profile-info {
						grid-column: span 1;
					}

					.stat-grid {
						grid-template-columns: 1fr;
					}

					.form-actions {
						flex-direction: column;
					}
				}
			`}</style>
		</div>
	);
};
export default Profile;
