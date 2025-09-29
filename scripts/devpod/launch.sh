#!/bin/bash
ID="$USER-mswa"
echo "Starting devpod with ID: ${ID}"
devpod up . --id "${ID}"