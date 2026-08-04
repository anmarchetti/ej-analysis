# We are using docker hardened images, find list of available tags here: https://hub.docker.com/hardened-images/catalog/dhi/node
ARG NODE_VERSION=22-alpine3.23

FROM dhi.io/node:${NODE_VERSION}-dev AS deps

# Install libc6-compat for compatibility with glibc dependencies (e.g. Next.js SWC compiler)
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src

# Copy the project files for Prototypes and app_
COPY Prototypes ./Prototypes
COPY app_ ./app_

# Install dependencies and build for Prototypes
WORKDIR /usr/src/Prototypes
RUN npm ci

# Install dependencies and build for app_
WORKDIR /usr/src/app_

RUN npm ci && \
    npm run build:production && \
    npm run build:postbuild && \
    npm run build:postbuild-cleanup


# Runtime image: hardened distroless prod image (no shell, no package manager, runs as node)
FROM dhi.io/node:${NODE_VERSION} AS runner

ENV NODE_ENV=production \
    NODE_PATH=/app/.next \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    FORCE_COLOR=0

WORKDIR /app

# Copy the built application and startup entrypoint
COPY --from=deps --chown=node:node /usr/src/app_/build ./
COPY --chown=node:node app_/startup.js ./startup.js

USER node

EXPOSE 3000

# startup.js copies EFS config files then starts the Node backend directly.
CMD ["node", "/app/startup.js"]
