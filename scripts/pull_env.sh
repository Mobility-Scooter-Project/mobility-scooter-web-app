#!/bin/bash
infisical login --domain https://infisical.cis240470.projects.jetstream-cloud.org
infisical secrets --projectId e3994b3d-5080-48f1-bb0f-c37f3b9793e9 --env dev --plain --tags api > apps/api/.env

echo "Pulled latest .env from Infisical"