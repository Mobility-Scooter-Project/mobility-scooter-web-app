#!/bin/bash
ID="$HOSTNAME-mswa"
devpod up . --id "${ID,,}"