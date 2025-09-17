#!/bin/bash
export KUBECONFIG=$HOME/.kube/config    

devpod provider add kubernetes -o ARCHITECTURE=amd64 -o CLUSTER_ROLE=devpod-role -o INACTIVITY_TIMEOUT=30m -o KUBERNETES_CONFIG=$KUBECONFIG -o SERVICE_ACCOUNT=devpod-sa -o STORAGE_CLASS=default
devpod provider use kubernetes  