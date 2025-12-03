# ✅ Checklist Endpoints KYC - Sprint 1

## Endpoints Backend (NestJS)

### 1. POST /kyc/start
- [x] Endpoint créé
- [x] Auth JWT (Phase 2 - en attente Jihad)
- [x] Création applicant Sumsub (Phase 2 - mocké pour l'instant)
- [x] Génération token SDK Sumsub (Phase 2 - mocké pour l'instant)
- [x] Création enregistrement KycVerification
- [x] Audit log créé
- [x] Métriques Prometheus incrémentées
- [x] Tests unitaires passants
- [x] Documentation Swagger

**Réponse:**
```json
{
  "token": "string",
  "applicantId": "string"
}
```

### 2. GET /kyc/status
- [x] Endpoint créé
- [x] Auth JWT (Phase 2 - en attente Jihad)
- [x] Récupération statut depuis KycVerification
- [x] Retourne NONE si pas de KYC
- [x] Métriques Prometheus incrémentées
- [x] Tests unitaires passants
- [x] Documentation Swagger

**Réponse:**
```json
{
  "status": "NONE | PENDING | APPROVED | REJECTED",
  "applicantId": "string | null",
  "updatedAt": "2025-12-03T12:00:00Z"
}
```

### 3. POST /webhooks/sumsub
- [x] Endpoint créé
- [x] Public (pas d'auth nécessaire)
- [x] Validation signature HMAC (Phase 2 - mocké pour l'instant)
- [x] Traitement webhook review complétée
- [x] Mise à jour statut KYC (APPROVED/REJECTED)
- [x] Promotion role ORGANIZER (Phase 2 - en attente User model)
- [x] Idempotence (correlationId)
- [x] Audit log créé
- [x] Métriques Prometheus incrémentées
- [x] Tests unitaires passants
- [x] Documentation Swagger

**Headers:**
- `x-payload-digest`: Signature HMAC-SHA256

**Body:**
```json
{
  "applicantId": "string",
  "correlationId": "string",
  "reviewStatus": "completed",
  "reviewResult": {
    "reviewAnswer": "GREEN | RED",
    "rejectLabels": ["string"]
  }
}
```

**Réponse:**
```json
{
  "success": true
}
```

---

## Endpoints Frontend Mobile (React Native)

### 1. Hook useKyc
- [x] `startKyc()` - Appelle POST /kyc/start
- [x] `getKycStatus()` - Appelle GET /kyc/status
- [x] Cache React Query
- [x] Gestion erreurs
- [x] Invalidation cache

### 2. Écrans
- [x] ProfileScreen - Affiche statut KYC
- [x] KycWebViewScreen - WebView Sumsub SDK
- [x] Navigation entre écrans
- [x] Gestion états (loading, error, success)

---

## Phase 2 - À faire après Auth de Jihad

- [ ] Ajouter `@UseGuards(JwtAuthGuard)` sur /kyc/start et /kyc/status
- [ ] Remplacer `?userId=` par `req.user.id`
- [ ] Intégration vraie API Sumsub (création applicant + génération token)
- [ ] Validation HMAC webhook réelle
- [ ] Promotion `User.role = ORGANIZER` après APPROVED
- [ ] Tests E2E complets

