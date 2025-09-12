#!/bin/bash

# Wait for files to sync and setup script
echo "Setting up development environment..."

# Wait for package.json to be available
while [ ! -f "/workspaces/mobility-scooter-web-app/package.json" ]; do
    echo "Waiting for workspace files to sync..."
    sleep 2
done

echo "Workspace files synced successfully!"
echo "Installing Node.js dependencies..."

cd /workspaces/mobility-scooter-web-app || exit 1
ls -la

# Install node dependencies
pnpm install

# Setup Python environment for video worker
echo "Setting up Python environment..."
cd apps/video-worker || exit 1
poetry install

echo "Setup complete!"