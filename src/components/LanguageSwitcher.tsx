import React from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

interface LanguageSwitcherProps {
	className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
	const { i18n } = useTranslation();

	const changeLanguage = (language: string) => {
		i18n.changeLanguage(language);
	};

	const currentLanguage = i18n.language || "en";

	return (
		<div className={`language-switcher ${className || ""}`}>
			<select
				value={currentLanguage}
				onChange={(e) => changeLanguage(e.target.value)}
				aria-label="Select Language"
			>
				<option value="en">English</option>
				<option value="zh">中文</option>
			</select>
		</div>
	);
};

export default LanguageSwitcher;