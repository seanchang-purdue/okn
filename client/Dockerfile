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

# Install all dependencies (including devDependencies)
RUN pnpm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 4321

# Start the development server
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Build stage for production
FROM base AS builder

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

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

# Install production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --prod --frozen-lockfile; else pnpm install --prod; fi

# Expose the port
EXPOSE 4321

# Start the application
CMD ["pnpm", "preview", "--host", "0.0.0.0"]
