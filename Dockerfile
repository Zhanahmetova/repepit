FROM node:23.0.0-alpine AS builder

WORKDIR /project
COPY package.json ./

RUN yarn install

COPY . /project

RUN yarn build \
    && rm -rf node_modules

FROM node:23.0.0-alpine AS runner

WORKDIR /project


COPY --from=builder /project/package.json /project
COPY --from=builder /project/.output /project/.output
COPY --from=builder /project/yarn.lock /project/yarn.lock


CMD ["yarn", "start"]

EXPOSE 3000