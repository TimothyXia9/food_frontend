/**
 * Analytics utility functions for tracking user interactions
 */

import { track } from "@vercel/analytics";

/**
 * Track page views
 */
export const trackPageView = (pageName: string) => {
	if (process.env.REACT_APP_ENABLE_ANALYTICS === "true") {
		track("page_view", { page: pageName });
	}
};

/**
 * Track user actions
 */
export const trackUserAction = (action: string, properties?: Record<string, string | number>) => {
	if (process.env.REACT_APP_ENABLE_ANALYTICS === "true") {
		track(action, properties);
	}
};

/**
 * Track food searches
 */
export const trackFoodSearch = (query: string, resultsCount: number) => {
	trackUserAction("food_search", {
		query: query.substring(0, 50), // Limit query length for privacy
		results_count: resultsCount,
	});
};

/**
 * Track meal creation
 */
export const trackMealCreation = (mealType: string, foodCount: number) => {
	trackUserAction("meal_created", {
		meal_type: mealType,
		food_count: foodCount,
	});
};

/**
 * Track user authentication
 */
export const trackAuth = (action: "login" | "register" | "logout") => {
	trackUserAction("auth", { action });
};