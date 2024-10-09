FROM node:22-alpine

# Install yarn
RUN apk add --no-cache yarn

WORKDIR /app

# Copy package.json and yarn.lock (if it exists)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application without running astro check
RUN yarn build

EXPOSE 4321

CMD ["yarn", "start"]
