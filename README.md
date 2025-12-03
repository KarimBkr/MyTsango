# MyTsango - Sprint 1 (Phase 1)

Application mobile de gestion de cercles de tontine rotative avec vérification KYC.

## 📋 Phase 1 - Implémentation

Cette Phase 1 implémente l'infrastructure KYC **sans dépendances Auth** pour permettre un développement parallèle avec le module Auth de Jihad.

### ✅ Fonctionnalités Phase 1

**Backend (NestJS)**
- ✅ Module KYC avec endpoints mockés (pas de JWT guard)
- ✅ Webhook Sumsub public avec validation HMAC
- ✅ Métriques Prometheus (compteurs + histogramme)
- ✅ Modèle Prisma `KycVerification` complet
- ✅ Tests unitaires (KycService + KycController)
- ✅ Logs structurés

**Mobile (Expo)**
- ✅ ProfileScreen avec affichage statut KYC
- ✅ KycWebViewScreen avec WebView mockée
- ✅ Hook `useKyc` avec React Query
- ✅ Composant `KycStatusBadge` coloré
- ✅ Navigation React Navigation

### 🔄 Phase 2 (Après Auth de Jihad)

- ⏳ Ajout `JwtAuthGuard` sur endpoints KYC
- ⏳ Intégration vraie API Sumsub
- ⏳ Champ `role` dans User + promotion ORGANIZER
- ⏳ Tests E2E complets

---

## 🚀 Installation & Démarrage

### Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm ou pnpm

### Backend

```bash
cd backend

# Installer dépendances
npm install

# Configurer environnement
cp .env.example .env
# Éditer .env avec votre DATABASE_URL

# Démarrer PostgreSQL (Docker)
docker run -d \
  --name mytsango-postgres \
  -e POSTGRES_PASSWORD=dev123 \
  -e POSTGRES_DB=mytsango \
  -p 5432:5432 \
  postgres:15

# Générer Prisma Client et migrer DB
npx prisma generate
npx prisma migrate dev --name init

# Lancer serveur dev
npm run start:dev
```

Le backend sera disponible sur `http://localhost:3000`
- API Docs: http://localhost:3000/api/docs
- Metrics: http://localhost:3000/metrics

### Mobile

```bash
cd mobile

# Installer dépendances
npm install

# Lancer Expo
npm start

# Scanner le QR code avec Expo Go
```

**Important**: Modifier `src/api/client.ts` avec l'IP locale de votre machine si vous testez sur un appareil physique.

---

## 🧪 Tests

### Backend

```bash
cd backend

# Tests unitaires
npm test

# Tests avec coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Mobile

```bash
cd mobile

# Tests (à implémenter)
npm test
```

---

## 📡 API Endpoints (Phase 1)

### POST /kyc/start
Démarre la vérification KYC (mocké)

**Query Params:**
- `userId` (string, required) - ID utilisateur temporaire

**Response:**
```json
{
  "token": "mock-sdk-token-...",
  "applicantId": "mock-applicant-..."
}
```

### GET /kyc/status
Récupère le statut KYC

**Query Params:**
- `userId` (string, required)

**Response:**
```json
{
  "status": "NONE|PENDING|APPROVED|REJECTED",
  "applicantId": "...",
  "updatedAt": "2024-..."
}
```

### POST /webhooks/sumsub
Webhook public Sumsub

**Headers:**
- `x-payload-digest` - Signature HMAC (mockée en Phase 1)

**Body:**
```json
{
  "applicantId": "...",
  "reviewStatus": "completed",
  "reviewResult": {
    "reviewAnswer": "GREEN|RED"
  }
}
```

---

## 📊 Métriques Prometheus

Disponibles sur `/metrics`:

- `kyc_requests_total` - Total requêtes KYC
- `kyc_success_total` - Vérifications réussies
- `kyc_failure_total` - Échecs KYC
- `kyc_duration_seconds` - Durée opérations

---

## 🧪 Tests Manuels

### 1. Tester le backend

```bash
# Start KYC
curl -X POST "http://localhost:3000/kyc/start?userId=test-123"

# Get Status
curl "http://localhost:3000/kyc/status?userId=test-123"

# Simuler webhook approval
curl -X POST http://localhost:3000/webhooks/sumsub \
  -H "Content-Type: application/json" \
  -H "X-Payload-Digest: mock" \
  -d '{"applicantId":"mock-applicant-...","reviewStatus":"completed","reviewResult":{"reviewAnswer":"GREEN"}}'

# Vérifier statut mis à jour
curl "http://localhost:3000/kyc/status?userId=test-123"

# Métriques
curl http://localhost:3000/metrics | grep kyc
```

### 2. Tester le mobile

1. Lancer Expo (`npm start`)
2. Scanner QR avec Expo Go
3. Écran Profile s'affiche avec badge "Non vérifié"
4. Cliquer "Vérifier mon identité"
5. WebView mockée s'affiche
6. Cliquer "Simuler vérification réussie"
7. Retour au Profile → badge "Vérifié"

---

## 📁 Structure du Projet

```
MyTsango/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modèles KycVerification, AuditLog
│   ├── src/
│   │   ├── kyc/
│   │   │   ├── kyc.module.ts
│   │   │   ├── kyc.service.ts     # Service mocké Sumsub
│   │   │   ├── kyc.controller.ts  # Endpoints Phase 1
│   │   │   ├── dto/
│   │   │   ├── *.spec.ts          # Tests unitaires
│   │   ├── metrics/               # Prometheus
│   │   ├── prisma/                # Prisma service
│   │   ├── main.ts
│   │   └── app.module.ts
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios config
│   │   │   └── kyc.api.ts         # API KYC
│   │   ├── hooks/
│   │   │   └── useKyc.ts          # React Query hook
│   │   ├── screens/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── KycWebViewScreen.tsx
│   │   ├── components/
│   │   │   └── KycStatusBadge.tsx
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx
│   │   └── types/
│   │       └── kyc.types.ts
│   ├── App.tsx
│   └── package.json
│
└── README.md
```

---

## 🔐 Sécurité Phase 1

- ✅ Validation DTOs avec `class-validator`
- ✅ CORS configuré
- ✅ Logs d'audit pour événements KYC
- ✅ Webhook signature validation (mockée)
- ⏳ JWT Auth (Phase 2)
- ⏳ Rate limiting (Phase 2)

---

## 📝 Notes pour Phase 2

### Intégration Auth (Jihad)

1. Ajouter `@UseGuards(JwtAuthGuard)` sur:
   - `POST /kyc/start`
   - `GET /kyc/status`

2. Remplacer `?userId=` par extraction depuis `req.user.id`

3. Ajouter champ `role` dans User:
```prisma
model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
  role     UserRole @default(MEMBER)
  kycStatus KycStatus @default(NONE)
  kycApplicantId String?
}

enum UserRole {
  MEMBER
  ORGANIZER
  ADMIN
}
```

4. Mettre à jour `user.role = ORGANIZER` après KYC APPROVED

### Intégration Sumsub Réelle

1. Remplacer mocks dans `kyc.service.ts`:
```typescript
// Vraie création applicant
const applicant = await this.sumsubApi.createApplicant(userId);
const token = await this.sumsubApi.generateSdkToken(applicant.id);
```

2. Implémenter vraie validation HMAC webhook

3. Configurer secrets dans `.env`:
```
SUMSUB_APP_TOKEN=...
SUMSUB_SECRET_KEY=...
SUMSUB_WEBHOOK_SECRET=...
```

---

## 🤝 Contribution

**Sprint 1 - Équipe:**
- Loucman: KYC (Phase 1 ✅)
- Jihad: Auth (En cours)

---

## 📄 License

UNLICENSED - Projet privé MyTsango
