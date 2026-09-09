FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
EXPOSE 8000
CMD ["sh", "-lc", "npx prisma db push && npm run dev"]

FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM base AS prod
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 8000
CMD ["sh", "-lc", "npx prisma db push && npm run start"]

# ===== STAGE 1: Dependencies =====
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install --prod

# ===== STAGE 2: Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install all dependencies with build scripts enabled
RUN pnpm install --ignore-scripts=false

# Copy source code and prisma
COPY . .

# Generate Prisma Client and build
RUN pnpm prisma generate
RUN pnpm tsc

# ===== STAGE 3: Development =====
FROM node:20-alpine AS dev
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl

ENV NODE_ENV=development

# Copy package files and install all dependencies
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Install all dependencies
RUN pnpm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN pnpm prisma generate

# Copy source code
COPY . .

EXPOSE 8000

# Use ts-node for development with watch mode
CMD ["sh", "-lc", "pnpm prisma db push --force-reset && pnpm dev"]

# ===== STAGE 4: Production =====
FROM node:20-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json for metadata
COPY package.json ./

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8000

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/index.js"]
