import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const resources = {
	en: {
		translation: en
	},
	zh: {
		translation: zh
	}
};

// Initialize i18n
void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		debug: false,
		
		interpolation: {
			escapeValue: false,
		},
		
		detection: {
			order: ["localStorage", "navigator", "cookie"],
			caches: ["localStorage"],
			lookupLocalStorage: "i18nextLng",
			lookupFromPathIndex: 0,
			lookupFromSubdomainIndex: 0,
			
			// Custom language mapping for browser detection
			convertDetectedLanguage: (lng: string) => {
				// Map Chinese language variants to 'zh'
				if (lng.startsWith("zh")) {
					return "zh";
				}
				// Map English variants to 'en'
				if (lng.startsWith("en")) {
					return "en";
				}
				return lng;
			}
		}
	});

export default i18n;