import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		open: true,
		host: true,
	},
	build: {
		outDir: "build",
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ["react", "react-dom", "react-router-dom"],
					i18n: [
						"i18next",
						"react-i18next",
						"i18next-browser-languagedetector",
						"i18next-http-backend",
					],
				},
			},
		},
	},
	define: {
		// Replace process.env with import.meta.env for Vite
		"process.env": {},
	},
	envPrefix: "REACT_APP_",
});
