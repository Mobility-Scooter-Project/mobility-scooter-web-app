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

FROM nvidia/cuda:12.8.0-cudnn-runtime-ubuntu24.04 AS worker

RUN apt-get update \
 && apt-get install --no-install-recommends -y \
      python3 python3-pip python3-dev python-is-python3 curl \
      libpq-dev build-essential \
      libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

ARG POETRY_VERSION=2.1.2
ENV POETRY_HOME=/opt/poetry
ENV PATH="$POETRY_HOME/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 - --version $POETRY_VERSION

WORKDIR /worker

COPY ./apps/video-worker/ /worker/
RUN poetry config virtualenvs.in-project false \
 && poetry install --no-interaction --no-ansi

CMD ["poetry", "run", "python", "src/main.py"]