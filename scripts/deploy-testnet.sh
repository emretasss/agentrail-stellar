#!/usr/bin/env bash
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
IDENTITY="${1:-agentrail-deployer}"
ALIAS="${ALIAS:-agentrail-testnet}"

echo "==> Preparing Stellar identity: ${IDENTITY}"
if ! stellar keys public-key "${IDENTITY}" >/dev/null 2>&1; then
  stellar keys generate "${IDENTITY}" --network "${NETWORK}" --fund
else
  stellar keys fund "${IDENTITY}" --network "${NETWORK}" >/dev/null 2>&1 || true
fi

ADMIN="$(stellar keys public-key "${IDENTITY}")"
TOKEN="$(stellar contract id asset --asset native --network "${NETWORK}")"

echo "==> Building optimized WASM"
stellar contract build --package agent-pay --optimize

echo "==> Deploying AgentRail"
CONTRACT_ID="$(
  stellar contract deploy \
    --wasm target/wasm32v1-none/release/agent_pay.wasm \
    --source-account "${IDENTITY}" \
    --network "${NETWORK}" \
    --alias "${ALIAS}" \
    -- \
    --admin "${ADMIN}" \
    --token "${TOKEN}" \
    | tee /tmp/agentrail-deploy.log \
    | tail -n 1
)"

echo "==> Deployed contract: ${CONTRACT_ID}"
echo "VITE_AGENTRAIL_CONTRACT_ID=${CONTRACT_ID}"
echo "VITE_NATIVE_TOKEN_CONTRACT_ID=${TOKEN}"
