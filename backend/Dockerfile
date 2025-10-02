# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install 

# Copy rest of the backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Run backend server
CMD ["node", "server.js"]
