#!/bin/bash
ID="${HOSTNAME:-$(hostname)}-mswa"
ID=$(echo "${ID}" | tr '[:upper:]' '[:lower:]')
echo "Starting devpod with ID: ${ID}"

devpod up . --id "${ID}"