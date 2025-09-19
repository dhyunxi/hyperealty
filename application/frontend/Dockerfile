FROM node:18-alpine AS web
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY . .
CMD ["npm", "run", "dev"]

# FROM nginx:stable-alpine3.20
# COPY --from=web /app/build /usr/share/nginx/html
# COPY default.conf /etc/nginx/conf.d/
# EXPOSE 8080
# CMD ["nginx", "-g", "daemon off;"]
