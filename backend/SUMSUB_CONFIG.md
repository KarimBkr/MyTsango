# 🔐 Configuration Sumsub

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Sumsub Configuration
SUMSUB_APP_TOKEN=your_sumsub_app_token_here
SUMSUB_SECRET_KEY=your_sumsub_secret_key_here
SUMSUB_WEBHOOK_SECRET=your_sumsub_webhook_secret_here

# Sumsub Environment
SUMSUB_ENV=sandbox  # ou "production"
SUMSUB_BASE_URL=https://api.sumsub.com
```

## Comment obtenir les credentials

### 1. Créer un compte Sumsub

1. Aller sur https://sumsub.com
2. Créer un compte (sandbox gratuit disponible)
3. Se connecter au dashboard

### 2. Récupérer APP_TOKEN et SECRET_KEY

1. Dans le dashboard Sumsub, aller dans **Settings → API**
2. Créer une nouvelle application ou utiliser l'existante
3. Copier :
   - **App Token** → `SUMSUB_APP_TOKEN`
   - **Secret Key** → `SUMSUB_SECRET_KEY`

### 3. Configurer le Webhook Secret

1. Dans le dashboard, aller dans **Settings → Webhooks**
2. Configurer l'URL de webhook : `https://votre-domaine.com/kyc/webhooks/sumsub`
3. Copier le **Webhook Secret** → `SUMSUB_WEBHOOK_SECRET`

### 4. Pour le développement local (ngrok)

1. Démarrer ngrok : `ngrok http 3000`
2. Copier l'URL HTTPS (ex: `https://abc123.ngrok.io`)
3. Configurer dans Sumsub : `https://abc123.ngrok.io/kyc/webhooks/sumsub`
4. **Important**: L'URL ngrok change à chaque redémarrage (free tier)

## Structure des credentials

```
SUMSUB_APP_TOKEN=sb:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUMSUB_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUMSUB_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Environnements

### Sandbox (Développement)
- URL: `https://api.sumsub.com`
- Utilisé pour les tests
- Données de test disponibles

### Production
- URL: `https://api.sumsub.com` (même URL, credentials différents)
- Utilisé en production
- Vraies vérifications KYC

## Sécurité

⚠️ **IMPORTANT:**
- Ne jamais commiter les credentials dans Git
- Utiliser `.env` (déjà dans `.gitignore`)
- Utiliser des secrets managers en production (AWS Secrets Manager, etc.)
- Rotater les secrets régulièrement

## Test des credentials

Une fois configurés, tester avec :

```bash
# Tester la connexion Sumsub (Phase 2)
curl -X GET "https://api.sumsub.com/resources/applicants" \
  -H "X-App-Token: $SUMSUB_APP_TOKEN" \
  -H "X-App-Access-Sig: $(echo -n "GET/resources/applicants$(date +%s)" | openssl dgst -sha256 -hmac "$SUMSUB_SECRET_KEY" | cut -d' ' -f2)" \
  -H "X-App-Access-Ts: $(date +%s)"
```

## Documentation Sumsub

- API Documentation: https://developers.sumsub.com/api-reference/
- Webhook Events: https://developers.sumsub.com/api-reference/#webhooks
- SDK Documentation: https://developers.sumsub.com/api-reference/#sdk-integration

