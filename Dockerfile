# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Start the server (no tunnel needed on cloud)
CMD ["node", "server.js"]
