############################################################
# Build stage
############################################################
FROM node:18-alpine as build

RUN apk update && apk add --no-cache git

WORKDIR /tmp

# Copy package.json first to benefit from layer caching
COPY package*.json ./
COPY patches ./patches/

# Copy src to have config files for install
COPY . .

# Clean npm cache; added to fix an issue with the install process
RUN npm cache clean --force

# Install all dependencies
RUN npm ci --legacy-peer-deps

RUN npx patch-package

# Run build steps
RUN npm run build

############################################################
# Release stage
############################################################
FROM node:18-alpine as release

RUN apk update && apk add --no-cache git

VOLUME /parse-server/cloud /parse-server/config

WORKDIR /parse-server

COPY package*.json ./
COPY patches ./patches/

# Clean npm cache; added to fix an issue with the install process
RUN npm cache clean --force
RUN npm ci --legacy-peer-deps --production --ignore-scripts

RUN npx patch-package

COPY bin bin
COPY public_html public_html
COPY views views
COPY --from=build /tmp/lib lib
RUN mkdir -p logs && chown -R node: logs

ENV PORT=1337
USER node
EXPOSE $PORT

# ENTRYPOINT ["node", "--inspect=0.0.0.0:9229", "./bin/parse-server"]
ENTRYPOINT ["node", "./bin/parse-server"]
