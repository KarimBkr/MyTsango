# Sprint 1 - Auth & KYC Phase 2 - Guide de Démarrage Rapide

**Branch**: `feature/sprint1-auth-kyc-integration`

## 🚀 Démarrage Rapide (5 min)

### 1. Setup Environnement

```bash
# Vérifier branche actuelle
git branch

# Démarrer services Docker
cd infra
docker compose up -d postgres redis

# Installer dépendances (si pas déjà fait)
cd ../backend
npm install
cd ../mobile
npm install
```

### 2. Configurer Variables d'Environnement

```bash
# Backend
cd backend
cp .env.example .env

# Éditer .env avec:
# - JWT_SECRET=ton-secret-jwt-super-securise
# - SUMSUB_APP_TOKEN=sb_app_xxx (demander à l'équipe ou créer compte sandbox)
# - SUMSUB_SECRET_KEY=sb_secret_xxx
# - SUMSUB_WEBHOOK_SECRET=webhook_secret_xxx
```

### 3. Comprendre le Code Existant (Loucman)

**À lire en priorité**:
1. `backend/src/kyc/kyc.service.ts` - Logique KYC Phase 1
2. `backend/prisma/schema.prisma` - Modèles existants
3. `mobile/src/screens/ProfileScreen.tsx` - UI KYC
4. `README.md` - Documentation Phase 1

**Points clés à noter**:
- Ligne 21 `kyc.service.ts`: Mock Sumsub → À remplacer
- Ligne 194 `kyc.service.ts`: Validation HMAC mockée → À implémenter
- Ligne 21 `ProfileScreen.tsx`: userId hardcodé → À remplacer par AuthContext

---

## 📋 Par où Commencer?

### Option A: Tâche par Tâche (Recommandé)

**Commence par Tâche 1 (Auth Backend)**:

1. **Créer modèle User Prisma**:
```bash
cd backend
# Éditer prisma/schema.prisma
```

Ajouter:
```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password       String   // hashed with bcrypt
  role           UserRole @default(MEMBER)
  kycStatus      KycStatus @default(NONE)
  kycApplicantId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  kycVerification KycVerification?
}

enum UserRole {
  MEMBER
  ORGANIZER
  ADMIN
}
```

2. **Générer migration**:
```bash
npx prisma migrate dev --name add_user_model
npx prisma generate
```

3. **Créer module Auth**:
```bash
nest g module auth
nest g service auth
nest g controller auth
```

4. **Implémenter AuthService** (voir détails dans task.md)

---

### Option B: Tests First (TDD)

Si tu préfères TDD:

1. Écrire tests Auth d'abord
2. Implémenter pour faire passer les tests
3. Refactorer

---

## 🎯 Jalons Importants

### Jalon 1: Auth Backend ✅
**Vérification**: 
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# → Retourne {"token": "eyJhbGc..."}
```

### Jalon 2: JWT Guard ✅
**Vérification**:
```bash
# Sans token → 401
curl http://localhost:3000/kyc/status

# Avec token → 200
TOKEN="eyJhbGc..."
curl http://localhost:3000/kyc/status \
  -H "Authorization: Bearer $TOKEN"
```

### Jalon 3: Auth Mobile ✅
**Vérification**:
- Lancer app mobile
- Écran login s'affiche
- Login fonctionnel
- Redirection Profile après login
- Token persisté (fermer/rouvrir app)

### Jalon 4: Sumsub Réel ✅
**Vérification**:
- Start KYC depuis mobile
- SDK Sumsub s'ouvre dans WebView
- Upload document fonctionne
- Webhook reçu après validation

---

## 📚 Ressources Utiles

### Documentation
- [NestJS Auth](https://docs.nestjs.com/security/authentication)
- [Passport JWT](https://www.passportjs.org/packages/passport-jwt/)
- [Sumsub API](https://developers.sumsub.com/)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)

### Code Examples
```typescript
// Exemple JwtStrategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    return user; // Disponible dans req.user
  }
}
```

---

## 🐛 Troubleshooting

### Erreur: "Cannot find module '@nestjs/jwt'"
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

### Erreur: "JWT malformed"
- Vérifier JWT_SECRET dans .env
- Vérifier format token (Bearer eyJhbGc...)

### Mobile: "Network request failed"
- Vérifier API_URL dans client.ts
- Android: Utiliser `10.0.2.2:3000`
- iOS: Utiliser `localhost:3000`

---

## 💡 Conseils

1. **Commits fréquents**: Commit après chaque sous-tâche
2. **Tests d'abord**: Tester immédiatement après implémentation
3. **Demander aide**: Ping sur Slack si bloqué >30min
4. **Documentation**: Commenter code non-évident
5. **Swagger**: Ajouter decorators pour auto-doc

---

Bon courage! 🚀
