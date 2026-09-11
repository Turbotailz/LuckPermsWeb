# Build stage
FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NUXT_PUBLIC_SELF_HOSTED=true
ENV NUXT_PUBLIC_BYTEBIN_URL=/data/
ENV NUXT_PUBLIC_BYTESOCKS_URL=/ws/
ENV NUXT_PUBLIC_BYTESOCKS_HOST=usersockets.luckperms.net
RUN pnpm generate

# Run stage
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80/tcp
