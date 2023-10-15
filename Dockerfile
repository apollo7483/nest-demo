FROM node:alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

COPY --from=base /app/node_modules ./node_modules

COPY . .
RUN npm run build

ENV NODE_ENV production

RUN npm ci --only=production && npm cache clean --force


FROM node:alpine

# Copy the bundled code from the build stage to the production image
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist


EXPOSE 3001
# Start the server using the production build
CMD [ "node", "dist/main.js" ]
