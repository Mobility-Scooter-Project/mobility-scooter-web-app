FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/mswa
WORKDIR /usr/src/mswa
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build

FROM build AS web
WORKDIR /usr/src/mswa/apps/web
EXPOSE 3000
CMD [ "pnpm", "start" ]

FROM build AS api
WORKDIR /usr/src/mswa/apps/api
EXPOSE 3000
CMD [ "pnpm", "start" ]