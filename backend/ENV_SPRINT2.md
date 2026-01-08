# Variables d'environnement Sprint 2

## Paiements Stripe

```env
# Clé secrète Stripe (sk_test_xxx pour test, sk_live_xxx pour production)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Clé publique Stripe (pk_test_xxx pour test, pk_live_xxx pour production)
# À utiliser côté mobile dans App.tsx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Secret pour valider les webhooks Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Notifications Expo

Les notifications Expo Push utilisent l'API publique d'Expo, aucune clé API n'est requise côté backend.

Côté mobile, le token Expo Push sera généré automatiquement et envoyé au backend via un endpoint (à créer si nécessaire).

---

**Note**: Toutes les clés Stripe doivent être en mode TEST (`sk_test_`, `pk_test_`) pour le développement.

