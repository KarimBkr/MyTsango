#!/bin/sh
# Génère un jeton JWT signé avec le secret JWT_SECRET spécifié dans l'environnement
# Usage: ./scripts/generate-jwt.sh <userid>
# <userid> sera placé dans le champ 'sub' du token, représentant l'identifiant de l'utilisateur.

if [ -z "$1" ]; then
  echo "Veuillez fournir un userID (sous-jacent du JWT)."
  echo "Usage: $0 <user_id>"
  exit 1
fi

USERID=$1

# Header et payload JSON
HEADER='{"alg":"HS256","typ":"JWT"}'
PAYLOAD="{\"sub\":\"$USERID\"}"

# Encodage en Base64 URL-safe (sans padding) du header et du payload
BASE64_HEADER=$(echo -n "$HEADER" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
BASE64_PAYLOAD=$(echo -n "$PAYLOAD" | openssl base64 -A | tr '+/' '-_' | tr -d '=')

HEADER_PAYLOAD="$BASE64_HEADER.$BASE64_PAYLOAD"

# Calcul de la signature HMAC-SHA256
if [ -z "$JWT_SECRET" ]; then
  echo "JWT_SECRET n'est pas défini dans l'environnement. Utilisation d'un secret par défaut 'dev-secret'."
  JWT_SECRET="dev-secret"
fi
SIGNATURE=$(echo -n "$HEADER_PAYLOAD" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')

TOKEN="$HEADER_PAYLOAD.$SIGNATURE"
echo "JWT généré :"
echo "$TOKEN"
