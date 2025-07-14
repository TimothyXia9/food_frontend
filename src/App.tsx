import React, { useState } from "react";
import "./App.css";
import Navigation from "./components/Navigation";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import FoodSearch from "./pages/FoodSearch";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import ApiTest from "./pages/ApiTest";

function App() {
	const [currentPage, setCurrentPage] = useState("login");
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const handleLogin = () => {
		setIsAuthenticated(true);
		setCurrentPage("dashboard");
	};

	const handleLogout = () => {
		setIsAuthenticated(false);
		setCurrentPage("login");
	};

	const renderPage = () => {
		if (!isAuthenticated) {
			return <LoginPage onLogin={handleLogin} />;
		}

		switch (currentPage) {
		case "dashboard":
			return <Dashboard />;
		case "food-search":
			return <FoodSearch />;
		case "profile":
			return <Profile />;
		case "statistics":
			return <Statistics />;
		case "api-test":
			return <ApiTest />;
		default:
			return <Dashboard />;
		}
	};

	return (
		<div className="App">
			{isAuthenticated && (
				<Navigation
					currentPage={currentPage}
					onNavigate={setCurrentPage}
					onLogout={handleLogout}
				/>
			)}
			<main className="main-content">
				{renderPage()}
			</main>
		</div>
	);
}

export default App;
