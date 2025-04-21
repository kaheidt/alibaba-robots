# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built frontend and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Environment variables will be provided during runtime
ENV NODE_ENV=production \
    PORT=80

# Expose the port
EXPOSE 80

# Start the server
CMD ["node", "--require=dotenv/config", "server/index.js"]