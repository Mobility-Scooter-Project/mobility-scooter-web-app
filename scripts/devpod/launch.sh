#!/bin/bash
ID="$USER-mswa"
ID=$(echo "${ID}" | tr '[:upper:]' '[:lower:]')
echo "Starting devpod with ID: ${ID}"
devpod up . --id "${ID}"