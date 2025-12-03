# Runbooks - Procédures opérationnelles

## Migrations de base de données

### En développement
```bash
./scripts/migrate.sh nom_de_la_migration
```

### En production
Utiliser `prisma migrate deploy` dans le pipeline CI/CD pour appliquer les migrations sans interaction.

## Webhooks Stripe

### Test local
1. Le Stripe CLI est configuré automatiquement dans Docker
2. Pour déclencher un événement de test:
```bash
docker compose exec stripe stripe trigger payment_intent.succeeded
```
3. Le webhook secret est affiché au démarrage du conteneur stripe
4. Copier ce secret dans .env.backend (STRIPE_WEBHOOK_SECRET)

### Configuration en production
Configurer l'URL de webhook dans le dashboard Stripe vers votre domaine de production.

## Ngrok - URL publique

### Obtenir l'URL
1. Ouvrir http://localhost:4040
2. Copier l'URL "Forwarding" (https://xxxxx.ngrok.io)
3. Utiliser cette URL pour configurer les webhooks externes (SumSub, etc.)

### Renouvellement
À chaque redémarrage de ngrok, une nouvelle URL est générée (sauf avec un compte payant).
Mettre à jour les configurations externes en conséquence.

## SumSub - Configuration des callbacks

1. Se connecter au dashboard SumSub sandbox
2. Aller dans "Callbacks for applicant status change"  
3. Configurer l'URL: https://[ngrok-url]/webhooks/sumsub
4. Sauvegarder la configuration

## Prometheus & Grafana

### Ajouter une source de données dans Grafana
1. Ouvrir http://localhost:3001
2. Login: admin / admin
3. Configuration > Data Sources > Add data source
4. Sélectionner Prometheus
5. URL: http://prometheus:9090
6. Save & Test

### Ajouter des métriques
Modifier `/metrics` endpoint dans l'API pour exposer des métriques Prometheus.
Utiliser la librairie `prom-client` pour des métriques avancées.

## Dépannage

### Le conteneur API ne démarre pas
- Vérifier les logs: `docker compose logs api`
- Vérifier que PostgreSQL est accessible
- Vérifier les variables d'environnement

### L'app mobile ne se connecte pas à l'API
- Sur Android emulator: utiliser `10.0.2.2:3000` comme API_URL
- Sur iOS simulator: utiliser `localhost:3000`
- Sur device réel: utiliser l'IP locale de votre machine ou ngrok URL

### Prometheus ne collecte pas les métriques
- Vérifier que http://localhost:3000/metrics est accessible
- Vérifier la configuration dans infra/monitoring/prometheus.yml
- Vérifier l'état des targets dans http://localhost:9090/targets
