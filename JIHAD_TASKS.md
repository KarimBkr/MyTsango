# Sprint 1 - Auth & KYC Phase 2 (Jihad)

**Branche**: `feature/sprint1-auth-phase2-jihad`  
**Base**: `feature/sprint1-kyc-phase1` (Loucman)  
**Durée estimée**: 17-25h (3-4 jours)

---

## ✅ Contexte - Ce que Loucman a fait

Tu pars de la branche de Loucman qui contient:
- ✅ Backend: Module KYC complet (`backend/src/kyc/`)
- ✅ Mobile: ProfileScreen + KycWebViewScreen (`mobile/src/screens/`)
- ✅ Prisma: Modèles `KycVerification` + `AuditLog`
- ✅ Tests: 85% coverage unitaire
- ✅ Métriques: 4 métriques Prometheus KYC

**Ce qui manque (ton travail)**:
- ⏳ Authentification JWT
- ⏳ Protection endpoints KYC
- ⏳ Auth mobile (login/register)
- ⏳ Intégration Sumsub réelle
- ⏳ Validation HMAC webhooks

---

## 📋 Tes 9 Tâches

### 🔴 TÂCHE 1: Backend Auth Module (4-6h)

**Objectif**: Créer système d'authentification complet

#### 1.1 Modèle User Prisma
```bash
cd backend
# Éditer prisma/schema.prisma
```

Ajouter:
```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password       String   // bcrypt hashed
  role           UserRole @default(MEMBER)
  kycStatus      KycStatus @default(NONE)
  kycApplicantId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  kycVerification KycVerification? @relation(fields: [kycApplicantId], references: [applicantId])
  
  @@index([email])
}

enum UserRole {
  MEMBER
  ORGANIZER
  ADMIN
}
```

Migrer:
```bash
npx prisma migrate dev --name add_user_model
npx prisma generate
```

#### 1.2 Créer Module Auth
```bash
nest g module auth
nest g service auth
nest g controller auth
```

#### 1.3 Installer Dépendances
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

#### 1.4 Créer DTOs
Créer `backend/src/auth/dto/auth.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    kycStatus?: string;
  };
}
```

#### 1.5 Implémenter AuthService
Créer `backend/src/auth/auth.service.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user exists
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new UnauthorizedException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    // Generate JWT
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
```

#### 1.6 Créer AuthController
Créer `backend/src/auth/auth.controller.ts`:
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

#### 1.7 Configurer AuthModule
Éditer `backend/src/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

#### 1.8 Ajouter à AppModule
Éditer `backend/src/app.module.ts`:
```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    KycModule,
    MetricsModule,
    PrismaModule,
    AuthModule,  // ← Ajouter
  ],
})
export class AppModule {}
```

#### 1.9 Configurer .env
Éditer `backend/.env`:
```bash
JWT_SECRET=votre-super-secret-jwt-changez-moi-en-prod
```

**Tests**:
```bash
# Démarrer backend
npm run start:dev

# Test register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

### 🔴 TÂCHE 2: JWT Guard & Strategy (2-3h)

#### 2.1 Créer JwtStrategy
Créer `backend/src/auth/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    };
  }
}
```

#### 2.2 Créer JwtAuthGuard
Créer `backend/src/auth/guards/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### 2.3 Installer Passport
```bash
npm install @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

#### 2.4 Mettre à jour AuthModule
```typescript
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,  // ← Ajouter
    PrismaModule,
    JwtModule.register({...}),
  ],
  providers: [AuthService, JwtStrategy],  // ← Ajouter JwtStrategy
  exports: [AuthService],
})
export class AuthModule {}
```

**Tests**:
```bash
# Obtenir token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' \
  | jq -r '.token')

# Tester guard (à activer sur un endpoint test d'abord)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/me
```

---

### 🔴 TÂCHE 3: Protéger Endpoints KYC (1-2h)

#### 3.1 Mettre à jour KycController
Éditer `backend/src/kyc/kyc.controller.ts`:
```typescript
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kyc')
export class KycController {
  // ...

  @UseGuards(JwtAuthGuard)  // ← Ajouter
  @Post('start')
  async startKyc(@Request() req) {  // ← Changer
    const userId = req.user.id;      // ← Utiliser user du JWT
    return this.kycService.startKycVerification(userId);
  }

  @UseGuards(JwtAuthGuard)  // ← Ajouter
  @Get('status')
  async getKycStatus(@Request() req) {  // ← Changer
    const userId = req.user.id;
    return this.kycService.getKycStatus(userId);
  }

  // Webhook reste PUBLIC (pas de guard)
  @Post('/webhooks/sumsub')
  async handleWebhook(@Body() payload, @Headers('x-payload-digest') signature) {
    return this.kycService.handleWebhook(payload,signature);
  }
}
```

**Tests**:
```bash
# Sans token → 401
curl http://localhost:3000/kyc/status
# {"statusCode":401,"message":"Unauthorized"}

# Avec token → 200
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/kyc/status
```

---

### 🟡 TÂCHE 4: Auth Mobile (3-4h)

#### 4.1 Installer Dépendances
```bash
cd mobile
npm install @react-native-async-storage/async-storage
npm install axios react-query
```

#### 4.2 Créer AuthContext
Créer `mobile/src/contexts/AuthContext.tsx`:
```typescript
import React, { createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
  kycStatus?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data;
    
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
    
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, password });
    const { token: newToken, user: newUser } = response.data;
    
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
    
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### 4.3 Mettre à jour API Client
Éditer `mobile/src/api/client.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add interceptor for JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);
```

#### 4.4 Créer LoginScreen
Créer `mobile/src/screens/LoginScreen.tsx`:
```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      setError('');
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 16, borderRadius: 8 },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 8 },
  buttonText: { color: '#FFF', textAlign: 'center', fontWeight: '600' },
  error: { color: 'red', marginBottom: 12 },
});
```

#### 4.5 Mettre à jour Navigation
Éditer `mobile/src/navigation/AppNavigator.tsx`:
```typescript
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="KycWebView" component={KycWebViewScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
```

#### 4.6 Mettre à jour ProfileScreen
Éditer `mobile/src/screens/ProfileScreen.tsx`:
```typescript
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen = () => {
  const { user } = useAuth();  // ← Ajouter
  const userId = user?.id || '';  // ← Remplacer hardcode

  const { kycStatus } = useKyc(userId);
  // ...
};
```

---

### 🟢 TÂCHE 5-9: Sumsub, Tests, Monitoring (Voir document principal)

Les tâches 5 à 9 sont détaillées dans le document principal. Je te recommande de faire les tâches 1-4 d'abord (Auth), puis de passer aux suivantes.

---

## ✅ Checklist de Démarrage

- [x] Branche créée depuis celle de Loucman
- [ ] Backend démarré (`cd backend && npm run start:dev`)
- [ ] Mobile démarré (`cd mobile && npm start`)
- [ ] Variables `.env` configurées
- [ ] PostgreSQL running

---

## 🎯 Validation par Étape

**Après Tâche 1**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jihad@test.com","password":"Test123!"}'
# → Retourne {"token": "eyJ...", "user": {...}}
```

**Après Tâche 2-3**:
```bash
# Sans token → 401
curl http://localhost:3000/kyc/status

# Avec token → 200
curl -H "Authorization: Bearer eyJ..." http://localhost:3000/kyc/status
```

**Après Tâche 4**:
- Lancer app mobile
- Voir écran login
- Login fonctionne
- Redirection vers Profile

---

Commence par la **Tâche 1** (Backend Auth Module). Bonne chance! 🚀
