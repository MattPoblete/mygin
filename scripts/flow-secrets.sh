#!/usr/bin/env bash
#
# scripts/flow-secrets.sh — Sube las llaves de Flow a Secret Manager desde un
# archivo dotenv (por defecto functions/.secret.local), sin pegarlas a mano.
#
#   bash scripts/flow-secrets.sh [archivo]
#
# El archivo debe tener los nombres canónicos:
#   FLOW_SANDBOX_API_KEY=...
#   FLOW_SANDBOX_SECRET_KEY=...
#   FLOW_PRODUCTION_API_KEY=...
#   FLOW_PRODUCTION_SECRET_KEY=...
#
# Proyecto: env FIREBASE_PROJECT (default theirgin). Cada set crea una versión
# nueva del secreto (idempotente: re-correr actualiza). Requiere estar logueado
# (firebase login) y tener habilitada la Secret Manager API.
set -euo pipefail

ENV_FILE="${1:-functions/.secret.local}"
PROJECT="${FIREBASE_PROJECT:-theirgin}"
SECRETS=(FLOW_SANDBOX_API_KEY FLOW_SANDBOX_SECRET_KEY FLOW_PRODUCTION_API_KEY FLOW_PRODUCTION_SECRET_KEY)

[ -f "$ENV_FILE" ] || { echo "✗ No existe $ENV_FILE (copia functions/.secret.local.example)"; exit 1; }

for name in "${SECRETS[@]}"; do
  # última línea NAME=valor; quita comillas envolventes si las hay.
  value="$(grep -E "^${name}=" "$ENV_FILE" | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//')"
  if [ -z "$value" ]; then
    echo "⚠  $name vacío en $ENV_FILE — omitido"
    continue
  fi
  printf '%s' "$value" | npx -y firebase-tools@latest functions:secrets:set "$name" \
    --project "$PROJECT" --data-file - >/dev/null
  echo "✓  $name → Secret Manager ($PROJECT)"
done

echo "Listo. Despliega con: npx -y firebase-tools@latest deploy --only functions"
