# Stage to build JavaScript deps
FROM node:16.6 AS builder
WORKDIR /
COPY package*.json ./
RUN npm install

# Stage to run the app
FROM node:16.6 AS runner
WORKDIR /usr/src/app
COPY . .
COPY --from=builder /node_modules node_modules
ENTRYPOINT [ "npm", "run", "service" ]
