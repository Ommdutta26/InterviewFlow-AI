# Use official Node image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of project files
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["node", "app.js"]