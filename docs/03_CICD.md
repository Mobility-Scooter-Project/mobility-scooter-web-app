# CI/CD
## Continous Integration
On push to `main` and `develop`, as well as for every PR, [GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) builds the corresponding docker stage when code changes are detected under a given app folder.

## Continous Deployment
An [ArgoCD](https://argo-cd.readthedocs.io/en/stable/) ApplicationSet is constantly monitoring all repos within our GH org and deploys whatever YAML files are found under the `deploy`. In the future we will have [ArgoCD Image Updater](https://argocd-image-updater.readthedocs.io/en/stable/) or [Kargo](https://kargo.io/) update deployed image tags automatically.

### App Helm Charts
Each app has its own generalized [Helm Charts](https://helm.sh/) that is managed by ArgoCD. You can view the charts and their value files [here](https://github.com/Mobility-Scooter-Project/mobility-scooter-infra/tree/main/charts). The API chart contains DNS and [cert-manager](https://cert-manager.io/) annotations for provisioning custom subdomains under `cis240470.projects.jetstream-cloud.org`, as well as for connecting to the cluster database, queues, etc. The worker chart will eventually support specifying GPU resources, but for now the amount of replicas, vCPU and RAM can be specified as well via these charts.