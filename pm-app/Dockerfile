# PM App (SvelteKit) — production container
#
# Builds a Node server output via @sveltejs/adapter-node.

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Persist SQLite here (mount a volume to /app/.data)
# Also set CLAWD_HOME to a mounted clawd directory (e.g. /home/node/clawd)
ENV PORT=3000

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "build"]
