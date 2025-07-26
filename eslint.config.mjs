// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		// 针对 React 项目的配置
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				window: "readonly",
				document: "readonly",
				console: "readonly",
				process: "readonly",
			},
		},
		rules: {
			// 基础规则
			"no-unused-vars": "warn",
			"no-console": "off", // 允许 console.log
			"prefer-const": "warn",
			"no-var": "error",

			// TypeScript 特定规则
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-function-return-type": "off",

			// 代码风格
			semi: ["error", "always"],
			quotes: ["warn", "double"],
			// 移除 indent 规则，让 Prettier 处理缩进
			// indent: ["warn", "tab"],
			indent: [
				"warn",
				"tab",
				{
					SwitchCase: 1, // switch case 缩进 1 个 tab
					MemberExpression: 1,
					FunctionDeclaration: { parameters: 1 },
					FunctionExpression: { parameters: 1 },
					CallExpression: { arguments: 1 },
				},
			],
			"comma-trailing": "off",
		},
	},
	{
		// 忽略特定文件
		ignores: ["node_modules/**", "build/**", "dist/**", "*.config.js"],
	}
);
