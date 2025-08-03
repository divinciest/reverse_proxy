# Stage 1: Build React frontend
FROM node:20-slim AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
ENV NODE_ENV=development
RUN npm i --force


# Install additional required dependencies
RUN npm install --save-dev \
    node-polyfill-webpack-plugin \
    vite-plugin-node-polyfills \
    @types/node \
    rollup \
    @rollup/plugin-node-resolve \
    rollup-plugin-visualizer \
    @types/react \
    --legacy-peer-deps

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create Nginx server
FROM nginx:1.21.3-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Install certbot and its dependencies
RUN apk add --no-cache certbot certbot-nginx
# Configure Nginx
COPY ./nginx-http.conf /etc/nginx/conf.d/nginx-http.conf
COPY ./frontend.conf /etc/nginx/conf.d/frontend.conf
COPY backend.conf /etc/nginx/conf.d/backend.conf
COPY ./options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf

RUN ls -la /etc/letsencrypt/
# Expose ports
EXPOSE 80
EXPOSE 443
# Startup script to handle Let's Encrypt certificate creation and Nginx server
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
ENTRYPOINT ["/startup.sh"]