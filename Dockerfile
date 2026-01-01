FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "./dist/index.js"]
