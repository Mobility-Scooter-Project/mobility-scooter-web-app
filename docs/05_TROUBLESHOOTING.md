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

I'm having devpod issues after a cluster re-roll (connection refused, wrong kubeconfig, esbuild issues, etc):
- check that Devpod is using the kubeconfig.yaml in the repo root, not ~/.kube/config. Run from the repo root and set `export KUBECONFIG="$(pwd)/kubeconfig.yaml"`
- if you see "workspace already exists" or "connection refused", delete the workspace by name with `devpod delete --force <workspace-id>` (use `devpod list` to see IDs), then re-run `./scripts/devpod/setup.sh` and `./scripts/devpod/launch.sh`
- if migrations fail with esbuild errors (e.g. `@esbuild/linux-arm64` vs `@esbuild/linux-x64`), remove all node_modules and reinstall inside Devpod:

`rm -rf node_modules`
`pnpm -r exec rm -rf node_modules dist .turbo`
`pnpm install --force`
`pnpm -r rebuild esbuild`
