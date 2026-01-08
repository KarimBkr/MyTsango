# ✅ Vérification Structure KycVerification

## Modèle Prisma - KycVerification

### Champs Requis ✅

- [x] `id` (String, UUID, Primary Key)
- [x] `userId` (String) - Foreign key vers User (Phase 2)
- [x] `applicantId` (String?, Unique) - ID Sumsub applicant
- [x] `status` (KycStatus enum) - NONE, PENDING, APPROVED, REJECTED
- [x] `reviewStatus` (String?) - État review Sumsub
- [x] `reviewResult` (Json?) - Résultat complet Sumsub
- [x] `rejectReason` (String?) - Raison si rejeté
- [x] `createdAt` (DateTime) - Date création
- [x] `updatedAt` (DateTime) - Date dernière mise à jour
- [x] `approvedAt` (DateTime?) - Date approbation
- [x] `rejectedAt` (DateTime?) - Date rejet
- [x] `webhookEventId` (String?, Unique) - Pour idempotence

### Indexes ✅

- [x] Index sur `userId` (recherche rapide par utilisateur)
- [x] Index sur `status` (filtrage par statut)
- [x] Unique constraint sur `applicantId` (évite doublons)
- [x] Unique constraint sur `webhookEventId` (idempotence)

### Enum KycStatus ✅

- [x] `NONE` - Aucun KYC initié
- [x] `PENDING` - KYC en cours de traitement
- [x] `APPROVED` - KYC approuvé
- [x] `REJECTED` - KYC rejeté

### Relations (Phase 2) ⏳

- [ ] Foreign key `userId → User.id` (en attente User model de Jihad)
- [ ] Champ `User.kycStatus` synchronisé avec `KycVerification.status`
- [ ] Champ `User.kycApplicantId` synchronisé avec `KycVerification.applicantId`

### Validation ✅

- [x] `applicantId` unique (évite doublons Sumsub)
- [x] `webhookEventId` unique (idempotence webhook)
- [x] `status` par défaut = NONE
- [x] Timestamps automatiques (createdAt, updatedAt)

### Audit ✅

- [x] Modèle `AuditLog` pour traçabilité
- [x] Logs pour: kyc_started, kyc_approved, kyc_rejected, webhook_received
- [x] Index sur `userId`, `action`, `createdAt`

---

## Structure Complète Validée ✅

Le modèle `KycVerification` est **complet et conforme** aux exigences du Sprint 1.

**Points à compléter en Phase 2:**
- Lien Foreign Key avec User model
- Synchronisation User.kycStatus
- Promotion User.role = ORGANIZER après APPROVED

