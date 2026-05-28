FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEBSITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEBSITE_URL=$NEXT_PUBLIC_WEBSITE_URL
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.js"]
