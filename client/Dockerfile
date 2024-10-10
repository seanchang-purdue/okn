# Base stage for shared steps
FROM node:20-bullseye AS base
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile
COPY . .

# Development stage
FROM base AS development
ENV NODE_ENV=development
EXPOSE 4321
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
RUN yarn build

# Production stage
FROM node:20-bullseye-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN yarn install --production --frozen-lockfile
RUN yarn global add serve
EXPOSE 4321
CMD ["serve", "dist", "-p", "4321"]
