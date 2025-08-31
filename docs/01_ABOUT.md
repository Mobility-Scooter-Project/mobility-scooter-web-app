# About
This is repository contains all the apps that power the Mobility Scooter Web App. It is structured as a monorepo to allow [type-inference via the hono RPC client](https://hono.dev/docs/guides/rpc) from the backend to the frontend.

## Apps
This repo is divided into three apps:
- api ([Hono.js](https://hono.dev/))
- web ([React-Router](https://reactrouter.com/))
- video-worker (Python)

The api is connected to the frontend using the [backend-for-frontend (BFF) pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends). Although is may be rare, there is a chance that some code may be able to be shared between the api and web apps, and if that becomes the case then a separate packages directory should be created at the root of this repo.

## Dev Container
This repo uses [dev containers](https://containers.dev/) to enable a seamless environment setup and docker-compose to simulate a local Postgres database and Valkey cache. **You must have docker installed in order for this to work**. The base image for this repo is ubuntu, so bear this in mind while using your terminal.

## Infisical
Not every service can be effeciently replicated locally, which is why we use [Infisical](https://infisical.com/docs/documentation/platform/secrets-mgmt/overview) to store and retrieve our environment variables for Barbican, KeyStone and Swift securely from our Kubernetes cluster. You can request access to the project [here](https://infisical.cis240470.projects.jetstream-cloud.org/), and once approved by an admin you can pull it down with `sh scripts/pull_env.sh`.