import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      __BACKEND_ID__: JSON.stringify(env.VITE_BACKEND_CANISTER_ID || ""),
    },
    server: {
      proxy: {
        "/api": "http://127.0.0.1:4943",
      },
    },
  };
});