// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tsconfigPaths from "vite-tsconfig-paths";

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react(), tsconfigPaths()], // Automatically resolves paths from tsconfig.json
//   base: "/",
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "TaskWise",
        short_name: "TaskWise",
        description: "AI-Powered Task Management",
        theme_color: "#ffffff",
        icons: [
          // Add your app icons here if you have them
          {
            src: "brain.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  server: {
    hmr: true,
  },
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
        "firebase-messaging-sw": "./public/firebase-messaging-sw.js",
      },
    },
  },
});
