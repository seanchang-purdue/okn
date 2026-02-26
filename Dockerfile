# Base stage for shared settings
FROM node:22-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY .npmrc ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose the port
EXPOSE 4321

# Start the development server
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Build stage for production
FROM base AS builder

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM base AS production

# Set working directory
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/server.js ./server.js

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile
# Add express
RUN pnpm add express

# Expose the port
EXPOSE 4321

# Start using the custom server
CMD ["node", "server.js"]
