# MSWA Monorepo
This repo contains all the microservices for the Mobility Scooter Web App.

## Getting Started
### Turbo Repo
This repo is powered by turbo repo, which enables global tasking running from the root directory. Simply run the following commands to execute all of the matching commands from each app:

#### Install Dependencies
Turborepo uses pnpm as a package manager, and caches packages using pnpm workspaces.

```sh
pnpm i
```

#### Dev
Launches docker-compose, and all apps:
```sh
pnpm dev
```

#### Build
Builds `web` and `api` apps:
```sh
pnpm build
```

#### Test
Tests the `api` app:
```sh
pnpm test
```