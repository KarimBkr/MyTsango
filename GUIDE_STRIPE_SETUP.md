# 🔑 Guide Configuration Stripe - MyTsango

## 📋 Étape 1 : Créer un compte Stripe (si pas déjà fait)

1. Aller sur https://stripe.com
2. Cliquer sur **"Sign up"** ou **"Get started"**
3. Remplir le formulaire (email, mot de passe, etc.)
4. Vérifier ton email
5. Compléter les informations de base (nom, pays, etc.)

---

## 🔑 Étape 2 : Obtenir les clés de TEST

### 2.1 Accéder au Dashboard Stripe

1. Se connecter sur https://dashboard.stripe.com
2. **IMPORTANT** : Vérifier que tu es en mode **"Test mode"** (toggle en haut à droite)
   - Le toggle doit être sur **"Test"** (pas "Live")
   - En mode Test, tu peux tester sans frais réels

### 2.2 Récupérer les clés API

1. Dans le menu de gauche, aller dans **"Developers"** → **"API keys"**
2. Tu verras deux clés :

   **a) Publishable key (clé publique)**
   - Format : `
   - ✅ **Sécurisée à partager** (utilisée côté mobile)
   - Copier cette clé

   **b) Secret key (clé secrète)**
   - Format :
   - ⚠️ **NE JAMAIS PARTAGER** (utilisée côté backend uniquement)
   - Cliquer sur **"Reveal test key"** pour la voir
   - Copier cette clé

---

## 🔧 Étape 3 : Configurer le Backend

### 3.1 Créer/Modifier le fichier `.env`

```bash
cd backend
```

Si le fichier `.env` n'existe pas, le créer :

```bash
touch .env
```

### 3.2 Ajouter les clés Stripe dans `.env`

Ouvrir `backend/.env` et ajouter :

```env
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Important** :
- Remplacer `sk_test_xxxxxxxxxxxxxxxxxxxxx` par ta vraie clé secrète
- Pour `STRIPE_WEBHOOK_SECRET`, on le configurera à l'étape 5 (optionnel pour le développement)

---

## 📱 Étape 4 : Configurer le Mobile

### Option A : Variable d'environnement (Recommandé)

1. Créer un fichier `.env` dans `mobile/` :

```bash
cd mobile
touch .env
```

2. Ajouter dans `mobile/.env` :

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

3. Installer `expo-constants` si pas déjà fait :

```bash
npx expo install expo-constants
```

4. Mod
ifier `mobile/App.tsx` pour lire depuis `.env` :

```typescript
import Constants from 'expo-constants';

const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 
                               process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                               'pk_test_placeholder';
```

### Option B : Directement dans App.tsx (Simple pour test)

Modifier `mobile/App.tsx` ligne ~10 :

```typescript
// ⚠️ TODO: Récupérer depuis les variables d'environnement
// Pour l'instant, utiliser une clé publique Stripe de test
const STRIPE_PUBLISHABLE_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxx'; // ← METTRE TA CLÉ ICI
```

---

## 🪝 Étape 5 : Configurer les Webhooks (Optionnel - pour tests locaux)

### 5.1 Installer Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis https://stripe.com/docs/stripe-cli
```

### 5.2 Se connecter à Stripe CLI

```bash
stripe login
```

### 5.3 Écouter les webhooks en local

```bash
# Dans un terminal séparé
stripe listen --forward-to http://localhost:3000/payments/webhooks/stripe
```

Stripe CLI va te donner un `whsec_xxx` → **copier cette valeur**

### 5.4 Ajouter le webhook secret dans `.env`

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Étape 6 : Vérifier la Configuration

### Backend

1. Redémarrer le serveur backend :

```bash
cd backend
npm run start:dev
```

2. Vérifier dans les logs qu'il n'y a pas d'erreur Stripe
3. Si tu vois `STRIPE_SECRET_KEY not configured`, vérifier que `.env` est bien lu

### Mobile

1. Redémarrer Expo :

```bash
cd mobile
npm start
```

2. Tester l'écran de paiement
3. Si erreur, vérifier que la clé publique est bien configurée

---

## 🧪 Tester avec des Cartes de Test Stripe

Stripe fournit des numéros de cartes de test :

### Carte qui réussit toujours :
- Numéro : `4242 4242 4242 4242`
- Date : N'importe quelle date future (ex: `12/25`)
- CVC : N'importe quel 3 chiffres (ex: `123`)
- Code postal : N'importe quel code postal (ex: `75001`)

### Carte qui échoue :
- Numéro : `4000 0000 0000 0002`

### Autres cartes de test :
Voir https://stripe.com/docs/testing#cards

---

## 📝 Checklist Finale

- [ ] Compte Stripe créé
- [ ] Mode TEST activé dans le dashboard
- [ ] Clé secrète (`sk_test_xxx`) dans `backend/.env`
- [ ] Clé publique (`pk_test_xxx`) dans `mobile/App.tsx` ou `.env`
- [ ] Webhook secret configuré (si webhooks testés)
- [ ] Backend redémarré sans erreur
- [ ] Mobile redémarré sans erreur
- [ ] Test avec carte `4242 4242 4242 4242` fonctionne

---

## 🚨 Sécurité

⚠️ **NE JAMAIS COMMITTER** :
- Les fichiers `.env` (déjà dans `.gitignore`)
- Les clés Stripe dans le code
- Les clés en mode LIVE (`sk_live_`, `pk_live_`)

✅ **OK à partager** :
- Les clés en mode TEST (`pk_test_`, `sk_test_`) pour le développement en équipe
- Mais préférer utiliser des variables d'environnement

---

## 🆘 Problèmes Courants

### Erreur : "STRIPE_SECRET_KEY not configured"
→ Vérifier que `backend/.env` existe et contient `STRIPE_SECRET_KEY=sk_test_xxx`

### Erreur : "Invalid API Key"
→ Vérifier que tu utilises bien des clés en mode TEST (`sk_test_`, `pk_test_`)

### Erreur : "Webhook signature verification failed"
→ Vérifier que `STRIPE_WEBHOOK_SECRET` est correct (si tu testes les webhooks)

### Carte refusée même avec 4242 4242 4242 4242
→ Vérifier que tu es bien en mode TEST dans le dashboard Stripe

---

**🎉 Une fois configuré, tu peux tester les paiements avec les cartes de test Stripe !**

