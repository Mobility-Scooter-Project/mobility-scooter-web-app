# ==========================================
# 1. NODE BASE SETUP
# ==========================================
# Use a lightweight Node 22 image as the foundation for JS services.
FROM node:22-slim AS base
# Set up pnpm home directory and add it to the system PATH.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable Corepack to manage pnpm versions automatically.
RUN corepack enable

# ==========================================
# 2. SHARED NODE BUILD STAGE
# ==========================================
FROM base AS build
# Copy the entire monorepo into the container.
COPY . /usr/src/mswa
WORKDIR /usr/src/mswa
# Install dependencies using a cache mount to speed up subsequent pnpm installs.
# --frozen-lockfile ensures the build fails if the lockfile is out of sync.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Run the build script (likely using Turborepo) to compile all apps.
RUN pnpm build

# ==========================================
# 3. WEB (FRONTEND) SERVICE
# ==========================================
# Inherit everything from the 'build' stage.
FROM build AS web
WORKDIR /usr/src/mswa/apps/web
EXPOSE 3000
# Start the web application.
CMD [ "pnpm", "start" ]

# ==========================================
# 4. API (BACKEND) SERVICE
# ==========================================
# Inherit everything from the 'build' stage.
FROM build AS api
WORKDIR /usr/src/mswa/apps/api
EXPOSE 3000
# Start the backend API.
CMD [ "pnpm", "start" ]

# ==========================================
# 5. PYTHON WORKER: BUILDER STAGE
# ==========================================
# Start with a slim Python image to build the worker environment.
FROM python:3.11-slim AS worker-builder

# Install system-level build tools needed for C++ or database extensions.
# rm -rf /var/lib/apt/lists/* keeps the layer size small.
RUN apt-get update && apt-get install --no-install-recommends -y \
    curl \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install a specific version of Poetry for dependency management.
ARG POETRY_VERSION=2.1.2
ENV POETRY_HOME=/opt/poetry
ENV PATH="$POETRY_HOME/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 - --version $POETRY_VERSION

WORKDIR /app
# LEVERAGING CACHE: Copy only lockfiles first. 
# If these don't change, Docker skips the heavy 'poetry install' step.
COPY ./apps/video-worker/pyproject.toml ./apps/video-worker/poetry.lock* ./
# Create the virtualenv INSIDE the project folder and install dependencies.
# --with gpu ensures the heavy ML/CUDA libraries are included.
RUN poetry config virtualenvs.in-project true && \
    poetry sync --no-root --no-interaction --no-ansi --with gpu

# Copy the rest of the worker source code.
COPY ./apps/video-worker/ /app/

# ==========================================
# 6. PYTHON WORKER: FINAL RUNTIME
# ==========================================
# Start fresh with a clean Python image (this discards the 1GB+ of build tools).
FROM python:3.11-slim AS worker

# Install only the runtime libraries (graphics and database drivers).
RUN apt-get update && apt-get install --no-install-recommends -y \
    libpq5 \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# Security best practice: Run as a non-root user.
RUN useradd --create-home --shell /bin/bash appuser
USER appuser
WORKDIR /home/appuser/app

# REAPING THE BENEFITS: Only copy the final environment and source code.
# This leaves behind the Poetry tool and compiler junk from the builder stage.
COPY --from=worker-builder --chown=appuser:appuser /app/.venv ./.venv
COPY --from=worker-builder --chown=appuser:appuser /app/src ./src

# Point the system to the virtual environment's binaries.
ENV PATH="/home/appuser/app/.venv/bin:$PATH"

# Run the worker script.
CMD ["python", "src/main.py"]