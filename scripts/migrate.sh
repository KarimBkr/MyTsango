#!/bin/sh
# Script pour appliquer les migrations de la base de données via Prisma
# Usage: ./scripts/migrate.sh "nom_de_la_migration"
# Si aucun nom fourni, utilisera "init" par défaut.

NAME=$1
if [ -z "$NAME" ]; then
  NAME="init"
fi

echo "Applying Prisma migrations with name: $NAME"
docker compose exec api npx prisma migrate dev --name "$NAME"
