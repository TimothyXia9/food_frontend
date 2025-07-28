import React from "react";
import { apiClient } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

interface TokenTestProps {
	onLoginRequired: () => void;
}

const TokenTest: React.FC<TokenTestProps> = ({ onLoginRequired }) => {
	const { isAuthenticated, user } = useAuth();
	const { info, error } = useNotification();

	const handleClearTokens = () => {
		// Clear tokens to simulate expiration
		localStorage.removeItem("auth_token");
		localStorage.removeItem("refresh_token");
		apiClient.setToken(null);
		info("已清除所有token，模拟token过期状态");
	};

	const handleTestAuthenticatedRequest = async () => {
		try {
			info("正在发送需要认证的请求...");
			// This should trigger the auth failure handler if tokens are expired
			const response = await apiClient.get("/auth/user/");
			if (response.success) {
				info("请求成功！用户已认证");
			}
		} catch (err) {
			error("请求失败，可能需要重新登录");
		}
	};

	const handleTestImageUpload = async () => {
		try {
			// Create a dummy file for testing
			const canvas = document.createElement("canvas");
			canvas.width = 100;
			canvas.height = 100;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(0, 0, 100, 100);
			}
			
			canvas.toBlob(async (blob) => {
				if (blob) {
					const testFile = new File([blob], "test-image.png", { type: "image/png" });
					info("正在测试图片上传认证...");
					
					try {
						const response = await apiClient.uploadFile("/images/upload/", testFile);
						if (response.success) {
							info("图片上传成功！认证有效");
						}
					} catch (err) {
						error("图片上传失败，可能需要重新登录");
					}
				}
			});
		} catch (err) {
			error("创建测试图片失败");
		}
	};

	const handleTestStreamingAnalysis = async () => {
		try {
			info("正在测试流式分析认证...");
			// This will test the streaming request with token handling
			const response = await apiClient.streamingRequest("/images/analyze-stream/", { image_id: 1 });
			if (response.ok) {
				info("流式分析请求成功！认证有效");
				// Close the stream immediately since we're just testing auth
				response.body?.cancel();
			}
		} catch (err) {
			error("流式分析失败，可能需要重新登录");
		}
	};

	return (
		<div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
			<h1>Token超时测试页面</h1>
			
			<div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
				<h3>当前状态</h3>
				<p><strong>认证状态:</strong> {isAuthenticated ? "已登录" : "未登录"}</p>
				<p><strong>用户信息:</strong> {user ? `${user.username} (${user.nickname})` : "无"}</p>
				<p><strong>Access Token:</strong> {localStorage.getItem("auth_token") ? "存在" : "不存在"}</p>
				<p><strong>Refresh Token:</strong> {localStorage.getItem("refresh_token") ? "存在" : "不存在"}</p>
			</div>

			<div style={{ marginBottom: "2rem" }}>
				<h3>测试操作</h3>
				<div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
					<button
						onClick={handleClearTokens}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#dc3545",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						清除所有Token（模拟过期）
					</button>
					
					<button
						onClick={handleTestAuthenticatedRequest}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						发送认证请求
					</button>
					
					<button
						onClick={handleTestImageUpload}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#6f42c1",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						测试图片上传认证
					</button>
					
					<button
						onClick={handleTestStreamingAnalysis}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#e83e8c",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						测试流式分析认证
					</button>
					
					<button
						onClick={onLoginRequired}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#28a745",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						手动弹出登录框
					</button>
				</div>
			</div>

			<div style={{ padding: "1rem", backgroundColor: "#e9ecef", borderRadius: "8px" }}>
				<h3>测试步骤</h3>
				<ol>
					<li>首先确保你已经登录</li>
					<li>点击"清除所有Token"按钮模拟token过期</li>
					<li>测试以下任一按钮，这应该会触发401错误：
						<ul>
							<li><strong>发送认证请求</strong> - 测试普通API请求</li>
							<li><strong>测试图片上传认证</strong> - 测试文件上传</li>
							<li><strong>测试流式分析认证</strong> - 测试流式响应</li>
						</ul>
					</li>
					<li>由于refresh token也被清除了，应该会自动弹出登录模态框</li>
					<li>重新登录后，再次测试请求应该成功</li>
				</ol>
				<p><strong>注意：</strong> 
					<br />• 图片上传测试会创建一个小的红色方块测试图片
					<br />• 流式分析测试会立即关闭流连接，仅测试认证
				</p>
			</div>
		</div>
	);
};

export default TokenTest;