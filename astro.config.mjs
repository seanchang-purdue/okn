import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

const allowedHosts = [
  ".us-east-2.elb.amazonaws.com",
  "main-alb-1377536340.us-east-2.elb.amazonaws.com",
];

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  server: {
    host: "0.0.0.0",
    port: 4321,
  },

  preview: {
    host: "0.0.0.0",
    port: 4321,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  
  // Configure Vite directly within Astro config
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      allowedHosts,
      hmr: {
        // HMR configuration if needed
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4321,
      allowedHosts,
    },
  },
});
