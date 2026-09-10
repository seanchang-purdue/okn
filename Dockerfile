# Base stage for shared settings
FROM node:22-slim AS base

# Install pnpm (pinned: pnpm 11 hard-fails on unapproved dependency build
# scripts, so an unpinned major bump can break the image build)
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY .npmrc ./
COPY pnpm-workspace.yaml ./

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
COPY package.json pnpm-lock.yaml* .npmrc pnpm-workspace.yaml ./

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

ENV NODE_ENV=production
ENV PORT=4321
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the port
EXPOSE 4321

# Start the Next.js server
CMD ["node", "server.js"]
