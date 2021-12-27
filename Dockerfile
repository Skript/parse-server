# Build stage
FROM node:12.13.1-alpine as build

RUN apk update; \
  apk add git;
WORKDIR /tmp
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

# Release stage
FROM node:12.13.1-alpine as release

RUN apk update; \
  apk add git;

VOLUME /parse-server/cloud /parse-server/config

WORKDIR /parse-server

COPY package*.json ./

RUN npm i --production --ignore-scripts

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
