# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application files
COPY . .

# Build React app with Vite
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Vite uses 5173 by default)
EXPOSE 5173

# Start Vite in preview mode (serves built files)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]