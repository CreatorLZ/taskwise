// vite.config.ts
import { defineConfig } from "file:///C:/Users/USER/taskwise/client/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/USER/taskwise/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tsconfigPaths from "file:///C:/Users/USER/taskwise/client/node_modules/vite-tsconfig-paths/dist/index.js";
import { VitePWA } from "file:///C:/Users/USER/taskwise/client/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
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
            type: "image/svg+xml"
          }
        ]
      }
    })
  ],
  server: {
    hmr: true
  },
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
        "firebase-messaging-sw": "./public/firebase-messaging-sw.js"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJjOlxcXFxVc2Vyc1xcXFxVU0VSXFxcXHRhc2t3aXNlXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiYzpcXFxcVXNlcnNcXFxcVVNFUlxcXFx0YXNrd2lzZVxcXFxjbGllbnRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2M6L1VzZXJzL1VTRVIvdGFza3dpc2UvY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7Ly8gaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuLy8gaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG4vLyBpbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xyXG5cclxuLy8gLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuLy8gZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuLy8gICBwbHVnaW5zOiBbcmVhY3QoKSwgdHNjb25maWdQYXRocygpXSwgLy8gQXV0b21hdGljYWxseSByZXNvbHZlcyBwYXRocyBmcm9tIHRzY29uZmlnLmpzb25cclxuLy8gICBiYXNlOiBcIi9cIixcclxuLy8gfSk7XHJcblxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0c2NvbmZpZ1BhdGhzKCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSxcclxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcclxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Z31cIl0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcImZhdmljb24uaWNvXCIsIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIiwgXCJtYXNrLWljb24uc3ZnXCJdLFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6IFwiVGFza1dpc2VcIixcclxuICAgICAgICBzaG9ydF9uYW1lOiBcIlRhc2tXaXNlXCIsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQUktUG93ZXJlZCBUYXNrIE1hbmFnZW1lbnRcIixcclxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjZmZmZmZmXCIsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIC8vIEFkZCB5b3VyIGFwcCBpY29ucyBoZXJlIGlmIHlvdSBoYXZlIHRoZW1cclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiBcImJyYWluLnN2Z1wiLFxyXG4gICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2Uvc3ZnK3htbFwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhtcjogdHJ1ZSxcclxuICB9LFxyXG4gIGJhc2U6IFwiL1wiLFxyXG4gIHB1YmxpY0RpcjogXCJwdWJsaWNcIixcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcImRpc3RcIixcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgICAgICBtYWluOiBcIi4vaW5kZXguaHRtbFwiLFxyXG4gICAgICAgIFwiZmlyZWJhc2UtbWVzc2FnaW5nLXN3XCI6IFwiLi9wdWJsaWMvZmlyZWJhc2UtbWVzc2FnaW5nLXN3LmpzXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBVUEsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLFNBQVMsZUFBZTtBQUd4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCxjQUFjO0FBQUEsUUFDZCxhQUFhO0FBQUEsUUFDYix1QkFBdUI7QUFBQSxRQUN2QixjQUFjLENBQUMsZ0NBQWdDO0FBQUEsTUFDakQ7QUFBQSxNQUNBLGVBQWUsQ0FBQyxlQUFlLHdCQUF3QixlQUFlO0FBQUEsTUFDdEUsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBO0FBQUEsVUFFTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLEtBQUs7QUFBQSxFQUNQO0FBQUEsRUFDQSxNQUFNO0FBQUEsRUFDTixXQUFXO0FBQUEsRUFDWCxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsUUFDTCxNQUFNO0FBQUEsUUFDTix5QkFBeUI7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
