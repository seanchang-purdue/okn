import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  server: {
    host: '0.0.0.0',
    port: 4321,
  },
  
  // For development server
  devServer: {
    host: '0.0.0.0',
    port: 4321,
  },
  
  // For preview server (what you're using in production)
  preview: {
    host: '0.0.0.0',
    port: 4321,
    // Add the allowed hosts here
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  
  // Configure Vite directly within Astro config
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '0.0.0.0',
      hmr: {
        // HMR configuration if needed
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4321,
      // Add the allowed hosts here
      allowedHosts: [
        '*.us-east-2.elb.amazonaws.com',
        // '*.us-east-2.elb.amazonaws.com',
      ],
    },
  },
});