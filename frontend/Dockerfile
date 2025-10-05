FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and explicitly install rollup binary for linux
RUN npm install && npm install @rollup/rollup-linux-x64-gnu

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set Vite to listen on all interfaces
ENV HOST=0.0.0.0

# Command will be overridden by docker-compose
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]