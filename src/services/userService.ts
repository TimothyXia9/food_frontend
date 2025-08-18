import { apiClient } from "../utils/api";
import { ApiResponse, User, UserProfile } from "../types/api";

interface UserProfileResponse {
	user: User;
	profile: UserProfile;
}

interface UpdateProfileRequest {
	nickname?: string;
	date_of_birth?: string;
	gender?: string;
	height?: number;
	weight?: number;
	daily_calorie_goal?: number;
}

class UserService {
	async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
		return apiClient.get<UserProfileResponse>("/users/profile/");
	}

	async updateProfile(
		data: UpdateProfileRequest
	): Promise<ApiResponse<UserProfileResponse>> {
		return apiClient.put<UserProfileResponse>("/users/profile/", data);
	}
}

export const userService = new UserService();
