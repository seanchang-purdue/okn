// vite.config.js
export default {
  preview: {
    port: 4321,
    host: "0.0.0.0",
    // Allow all AWS ELB domains in us-east-2
    allowedHosts: [
      "*.us-east-2.elb.amazonaws.com",
      // You can add more specific domains if needed
      "main-alb-1377536340.us-east-2.elb.amazonaws.com",
    ],
  },
  server: {
    host: "0.0.0.0",
    // Also apply to development server if needed
    allowedHosts: [
      "*.us-east-2.elb.amazonaws.com",
      "main-alb-1377536340.us-east-2.elb.amazonaws.com",
    ],
  },
};
