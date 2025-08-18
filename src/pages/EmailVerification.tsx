import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

const EmailVerification: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const { setUserData } = useAuth();
	const { showSuccess, showError } = useNotification();
	const [isVerifying, setIsVerifying] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState<
		"pending" | "success" | "error"
	>("pending");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (token) {
			verifyEmail();
		} else {
			setVerificationStatus("error");
			setErrorMessage("Invalid verification link");
		}
	}, [token]);

	const verifyEmail = async () => {
		if (!token) return;

		setIsVerifying(true);
		try {
			const response = await authService.verifyEmail(token);

			if (response.success && response.data) {
				setVerificationStatus("success");
				showSuccess("Email verified successfully! You are now logged in.");

				// Auto-login user after successful verification
				if (response.data.token) {
					setUserData(response.data.user, response.data.token);
				}

				// Redirect to dashboard after a brief delay
				setTimeout(() => {
					navigate("/dashboard");
				}, 2000);
			} else {
				setVerificationStatus("error");
				const errorMsg = response.error?.message || "Email verification failed";
				setErrorMessage(errorMsg);
				showError(errorMsg);
			}
		} catch (err) {
			setVerificationStatus("error");
			setErrorMessage("An unexpected error occurred");
			showError("An unexpected error occurred");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResendVerification = () => {
		// Redirect to resend verification page
		navigate("/resend-verification");
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Email Verification
				</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{verificationStatus === "pending" && (
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
							<p className="mt-4 text-gray-600">
								{isVerifying ? "Verifying your email..." : "Processing verification..."}
							</p>
						</div>
					)}

					{verificationStatus === "success" && (
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
								Email Verified!
							</h3>
							<p className="mt-2 text-gray-600">
								Your email has been successfully verified. You are now logged in and
								will be redirected to your dashboard.
							</p>
						</div>
					)}

					{verificationStatus === "error" && (
						<div className="text-center">
							<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
								<svg
									className="h-6 w-6 text-red-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<h3 className="mt-4 text-lg font-medium text-gray-900">
								Verification Failed
							</h3>
							<p className="mt-2 text-gray-600">{errorMessage}</p>
							<div className="mt-6 space-y-3">
								<button
									onClick={handleResendVerification}
									className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Resend Verification Email
								</button>
								<button
									onClick={() => navigate("/")}
									className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Back to Home
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EmailVerification;
