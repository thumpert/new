# A long-lived Node server, not a serverless function — and that is a
# requirement, not a preference. Two things in this app depend on the process
# outliving the request that started it: the drawing and the writing are both
# started and then left to finish on their own, and everything an order owns
# (its JSON, its reference photos, its finished pages) is a file on disk.
#
# On a platform that freezes the process after the response, both break: the
# work dies part-way and the files vanish between requests. On a container
# with a volume, neither needs a line of code changed.

FROM node:22-slim AS base
# sharp measures every finished page, and its prebuilt binaries need these.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Dependencies, cached on the lockfile alone so a source edit does not reinstall
# ---------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
FROM base AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# Where orders and images live. Mount a volume here or an order created by one
# request will not exist for the next one after a restart.
RUN mkdir -p /app/.data && chown -R node:node /app/.data
VOLUME ["/app/.data"]

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
