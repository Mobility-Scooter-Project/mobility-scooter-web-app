# Mobility Scooter Web App Backend
## Get Started
Install node.js, and using your respective packagemanager, run the following command:
```
npm install
```
or
```
pnpm install
```
etc.

## Development
To run the development server, run the following command:
```
npm run dev
```
If you wish to dev alongside a development database, run the following command:
```
docker-compose up
```
This mimics are exact setup on Coolify.

## Build
To transpile to javascript, run the following command:
```
npm run build
```
To build the docker image, run the following command:
```
docker buildx bake ./docker
``

## Security
To generate an API key, run the following command:
```
npm run generate-api-key
```