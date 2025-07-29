import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useNotification } from "../contexts/NotificationContext";

const ResetPassword: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const { success, error } = useNotification();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [passwordReset, setPasswordReset] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (!token) {
			error("Invalid password reset link");
			navigate("/forgot-password");
		}
	}, [token, navigate, error]);

	const validatePassword = (pwd: string): string[] => {
		const errors = [];
		if (pwd.length < 8) {
			errors.push("Password must be at least 8 characters long");
		}
		if (!/(?=.*[a-z])/.test(pwd)) {
			errors.push("Password must contain at least one lowercase letter");
		}
		if (!/(?=.*[A-Z])/.test(pwd)) {
			errors.push("Password must contain at least one uppercase letter");
		}
		if (!/(?=.*\d)/.test(pwd)) {
			errors.push("Password must contain at least one number");
		}
		return errors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!token) {
			error("Invalid password reset link");
			return;
		}

		if (!password || !confirmPassword) {
			error("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			error("Passwords do not match");
			return;
		}

		const passwordErrors = validatePassword(password);
		if (passwordErrors.length > 0) {
			error(passwordErrors[0]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await authService.confirmPasswordReset(token, password);

			if (response.success) {
				setPasswordReset(true);
				success("Password reset successfully!");
			} else {
				const errorMsg = response.error?.message || "Failed to reset password";
				error(errorMsg);

				// If token is expired or invalid, redirect to forgot password page
				if (
					response.error?.code === "TOKEN_EXPIRED" ||
					response.error?.code === "INVALID_TOKEN"
				) {
					setTimeout(() => navigate("/forgot-password"), 2000);
				}
			}
		} catch (err) {
			error("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	if (passwordReset) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Password Reset Successful
					</h2>
				</div>

				<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
					<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
						<div className="text-center">
							<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
								<svg
									className="h-6 w-6 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								Password Successfully Reset
							</h3>
							<p className="mt-2 text-gray-600">
								Your password has been successfully reset. You can now log in with
								your new password.
							</p>
							<div className="mt-6">
								<button
									onClick={() => navigate("/")}
									className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Go to Login
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Reset Your Password
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Enter your new password below
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<form className="space-y-6" onSubmit={handleSubmit}>
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								New Password
							</label>
							<div className="mt-1 relative">
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="new-password"
									required
									value={password}
									onChange={e => setPassword(e.target.value)}
									className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="Enter new password"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<svg
											className="h-5 w-5 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
											/>
										</svg>
									) : (
										<svg
											className="h-5 w-5 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									)}
								</button>
							</div>
							<p className="mt-1 text-xs text-gray-500">
								Must be at least 8 characters with uppercase, lowercase, and number
							</p>
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700"
							>
								Confirm New Password
							</label>
							<div className="mt-1">
								<input
									id="confirmPassword"
									name="confirmPassword"
									type={showPassword ? "text" : "password"}
									autoComplete="new-password"
									required
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="Confirm new password"
								/>
							</div>
							{confirmPassword && password !== confirmPassword && (
								<p className="mt-1 text-xs text-red-600">Passwords do not match</p>
							)}
						</div>

						<div>
							<button
								type="submit"
								disabled={
									isLoading ||
									!password ||
									!confirmPassword ||
									password !== confirmPassword
								}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Resetting...
									</>
								) : (
									"Reset Password"
								)}
							</button>
						</div>

						<div className="text-center">
							<button
								type="button"
								onClick={() => navigate("/")}
								className="text-sm text-blue-600 hover:text-blue-500"
							>
								Back to Home
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ResetPassword;
