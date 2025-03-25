# Use a base image
FROM node:18 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN npm install --prefix ./frontend

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix ./backend

# Copy the entire project
COPY . .

# Build the frontend
RUN npm run build --prefix ./frontend

# Install serve to serve the frontend
RUN npm install -g serve

# Install supervisord
RUN apt-get update && apt-get install -y supervisor

# Expose the necessary ports
EXPOSE 3000 5000

# Copy the supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Start supervisord
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]