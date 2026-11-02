import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		VitePWA({
			// caches all the imports
			workbox: {
				globPatterns: ["**/*"]
			},
			// caches all the static assets in the public folder
			includeAssets: ["**/*"],
			manifest: {
				theme_color: "#f69435",
				background_color: "#f69435",
				display: "standalone",
				scope: "/",
				start_url: "/",
				short_name: "Grocery Split",
				description: "Grocery Split",
				name: "Grocery Split",
				icons: [
					{
						src: "/placeholder.svg",
						sizes: "1x1",
						type: "image/svg"
					}
				]
			}
		}),
		cloudflare({ viteEnvironment: { name: "worker" } })
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src")
		}
	}
});
