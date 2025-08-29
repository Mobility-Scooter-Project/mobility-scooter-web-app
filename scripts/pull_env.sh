#!/bin/bash
infisical login --domain https://infisical.cis240470.projects.jetstream-cloud.org
infisical secrets --projectId 7ea0e637-93ef-4c3f-b1e3-4563ed037d64 --env dev --plain --tags api > apps/api/.env

echo "Pulled latest .env from Infisical"