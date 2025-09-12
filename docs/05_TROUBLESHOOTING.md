# Troubleshooting
## Common Issues
I can't connect to a service:
- restart docker compose with `docker compose down` and `docker compose up -d`
- make sure you have the correct `.env` files in place (see [Setup](./devpod/SETUP.md#gitignored-files))

I'm having database errors:
- make sure your database is updated: `pnpm db:migrate`
- make sure you seeded your db with `pnpm db:seed`
- worse case, you can reset your db with `docker compose down -v` followed by `docker compose up -d` and then `pnpm db:migrate` and `pnpm db:seed`

I'm having devpod issues:
- make sure you have the `kubeconfig.yaml` file in the root of the project (see [Setup](./devpod/SETUP.md#gitignored-files))
- try deleting the devpod and starting over: `devpod delete` followed by `devpod up .`
- if your devpod is stuck in "waiting for agent" or something similar, message Bryan. There is a chance our cluster is out of volumes to run your devpod on.
- try resetting your devpod provider with `devpod delete` and `devpod provider delete kubernetes`, then run the setup script again (see [Setup](./devpod/SETUP.md#prepare-your-devpod-environment))