#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "Quickstart verify against ${BASE_URL}"

curl -s -X POST "${BASE_URL}/balances/transactions" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"REQ-QS-1","idempotencyKey":"IDEMP-QS-1","account":{"accountId":"ACC-QS-1","accountType":"CASH","currency":"CNY"},"transactions":[{"transactionType":"DEPOSIT","direction":"CREDIT","amount":"100.00"}]}'
echo

curl -s -X POST "${BASE_URL}/balances" \
  -H "Content-Type: application/json" \
  -d '{"accounts":[{"accountId":"ACC-QS-1","accountType":"CASH","currency":"CNY"},{"accountId":"ACC-NOT-EXIST","accountType":"CASH","currency":"CNY"}]}'
echo

curl -s "${BASE_URL}/balances/snapshots?requestId=REQ-QS-1"
echo

curl -s "${BASE_URL}/balances/transactions?accountId=ACC-QS-1&accountType=CASH&currency=CNY"
echo

echo "Quickstart verification finished."
