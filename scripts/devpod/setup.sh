#!/bin/bash
export KUBECONFIG=./kubeconfig.yaml   

devpod provider add kubernetes -o ARCHITECTURE=amd64 -o CLUSTER_ROLE=devpod-role -o INACTIVITY_TIMEOUT=30m -o KUBERNETES_CONFIG=$KUBECONFIG -o SERVICE_ACCOUNT=devpod-sa -o STORAGE_CLASS=devpod
devpod provider use kubernetes  