# Monorepo Project

## Prérequis
- Docker et Docker Compose installés
- (éventuellement Node.js si on veut exécuter en local)

## Installation & Démarrage (Dev)
1. Copier les fichiers `.env.backend.example` et `.env.mobile.example` en `.env.backend` et `.env.mobile`, puis ajuster les variables si nécessaire.
2. Lancer `docker compose up --build` depuis le dossier infra/.
3. Exécuter `docker compose exec api npx prisma migrate dev --name init` pour appliquer la migration initiale.
4. Ouvrir Expo DevTools sur http://localhost:19002 pour lancer l'app mobile (ou scanner le QR code).
5. Accéder à l'API Swagger sur http://localhost:3000/api-docs.

## Structure du monorepo
- apps/mobile: Application mobile React Native (Expo)
- services/api: API REST NestJS
- infra: Docker, CI, monitoring, etc.
- scripts: Scripts utiles (ex: migrations, JWT)
- docs: Documentation du projet (CGU, runbooks, etc.)

## Services disponibles

### API Backend (NestJS)
- URL: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs
- Métriques: http://localhost:3000/metrics

### Application Mobile (Expo) 
- DevTools: http://localhost:19002
- Metro Bundler: Port 19000

### Base de données
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050 (admin@admin.com / admin)

### Stockage
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)
- MinIO API: http://localhost:9000

### Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin)

### Outils
- Ngrok Web Interface: http://localhost:4040
- Stripe CLI: Configuré automatiquement

## Développement

Pour exécuter uniquement certains services:
```bash
cd infra
docker compose up api postgres redis  # Seulement le backend
```

Pour voir les logs d'un service spécifique:
```bash
docker compose logs -f api
```

Pour redémarrer un service:
```bash
docker compose restart api
```

## Scripts utiles

### Migration de base de données
```bash
./scripts/migrate.sh nom_de_la_migration
```

### Génération de JWT
```bash
export JWT_SECRET="votre-secret"
./scripts/generate-jwt.sh user_id
```
