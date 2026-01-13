import { defineConfig } from "vite";

export default defineConfig({
	// Uncomment to use JSX:
	// esbuild: {
	//   jsx: "transform",
	//   jsxFactory: "m",
	//   jsxFragment: "'['",
	// },

	server: {
		proxy: {
			// Matches local calls to http://localhost:5173/climate_data
			"/climate_data": {
        target: "https://climate.weather.gc.ca/climate_data/bulk_data_e.html",
				changeOrigin: true, // Changes the 'Host' header to the target URL
				rewrite: (path) => path.replace(/^\/climate_data/, ""),
				secure: false, // Use if the target uses self-signed certificates
			},
		},
	},
});
