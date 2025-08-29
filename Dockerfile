FROM node:22-slim AS base
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

FROM python:3.12-slim AS worker-builder

RUN apt-get update && apt-get install --no-install-recommends -y \
    curl \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

ARG POETRY_VERSION=2.1.2
ENV POETRY_HOME=/opt/poetry
ENV PATH="$POETRY_HOME/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 - --version $POETRY_VERSION

WORKDIR /app
COPY ./apps/video-worker/pyproject.toml ./apps/video-worker/poetry.lock* ./
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-root --no-interaction --no-ansi --with gpu

COPY ./apps/video-worker/ /app/

FROM python:3.12-slim AS worker

RUN apt-get update && apt-get install --no-install-recommends -y \
    libpq5 \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser
USER appuser
WORKDIR /home/appuser/app

COPY --from=worker-builder --chown=appuser:appuser /app/.venv ./.venv
COPY --from=worker-builder --chown=appuser:appuser /app/src ./src

ENV PATH="/home/appuser/app/.venv/bin:$PATH"

CMD ["python", "src/main.py"]