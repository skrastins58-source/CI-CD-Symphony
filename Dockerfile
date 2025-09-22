# Izmanto oficiālo Node.js 18 slim attēlu optimālai veiktspējai
# Use official Node.js 18 slim image for optimal performance
FROM node:18-slim

# Iestatīt darba direktoriju
# Set working directory
WORKDIR /usr/src/app

# Kopēt package.json un package-lock.json pirms citu failu kopēšanas labākai kešošanai
# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Instalēt atkarības izmantojot npm ci
# Install dependencies using npm ci
RUN npm ci

# Kopēt pārējo avota kodu
# Copy the rest of the source code
COPY . .

# Izveidot projektu ražošanas režīmā
# Build the project for production
RUN npm run build

# Ieteicamās drošības prakses - izveidot ne-root lietotāju
# Recommended security practice - create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /usr/src/app
USER appuser

# Atvērt portu 3000 (ja nepieciešams)
# Expose port 3000 (if needed)
EXPOSE 3000

# Noklusējuma komanda - izveidot projektu
# Default command - build the project
CMD ["npm", "run", "build"]