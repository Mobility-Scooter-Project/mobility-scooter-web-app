#!/bin/bash

vault server -dev -dev-root-token-id=root -dev-listen-address=0.0.0.0:8200 &
sleep 1
vault secrets enable -version=1 kv
tail -f /dev/null