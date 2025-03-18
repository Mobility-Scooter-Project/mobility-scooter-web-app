# Mobility Scooter Web App Backend
## Get Started
Install node.js, and using your respective package manager, run the following command:
```
npm install
```
or
```
pnpm install
```
etc.

## Development
To run the development server:
```
npm run dev
```
Run the following command to spin up a mock of our infrastructure:
```
docker-compose up
```
This mimics are exact setup on Coolify. To migrate your local database:
```
npm run db:migrate
```
If you have issues running migrations, reset your docker-compose with the following command:
```
docker-compose down -v # -v deletes the volumes
```
If you want to inspect your local database:
```
npm run db:studio
```

## Security
To generate an API key:
```
npm run generate-api-key
```

## Testing
To run the entire test suite, run the following command:
```
npm run test
```
**Note:** This will spin up a test server for you, so you can't run a dev server while running it, but you do need docker-compose running in order for the tests to pass.