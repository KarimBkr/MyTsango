# Contributing to MyTsango

Thank you for your interest in contributing! This document outlines our development workflow, coding conventions, and best practices.

## 🌿 Branching Strategy

We use a three-branch model:

### Main Branches

- **`main`** - Stable codebase, ready for release
  - Protected branch (requires PR + reviews)
  - Tagged releases (v1.0.0, v1.1.0, etc.)
  - Merged from `dev` after successful QA

- **`dev`** - Development integration branch
  - Protected branch (requires PR + reviews)
  - Features merged here first
  - Continuous integration testing

- **`prod`** - Production deployments
  - Protected branch (no direct push)
  - Tracks tagged versions from `main`
  - Represents current production state

### Feature Branches

Create feature branches from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

**Naming conventions:**
- `feature/` - New features (e.g., `feature/user-authentication`)
- `fix/` - Bug fixes (e.g., `fix/login-validation`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)

## 🔄 Development Workflow

### 1. Start New Work

```bash
# Ensure dev is up to date
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-feature

# Make your changes...
```

### 2. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add user registration endpoint"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

**Examples:**
```bash
git commit -m "feat(auth): implement JWT refresh token mechanism"
git commit -m "fix(api): resolve CORS issue on /users endpoint"
git commit -m "docs(readme): update environment setup instructions"
git commit -m "chore(deps): upgrade NestJS to v10.4"
```

### 3. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/my-feature

# Create PR on GitLab/GitHub targeting 'dev'
```

**PR Guidelines:**
- Fill out the PR template completely
- Reference related issues (Fixes #123)
- Ensure CI pipeline passes
- Request review from at least one team member
- Address review comments promptly

### 4. Code Review

Reviewers should check:
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No sensitive data committed
- [ ] Performance implications considered

### 5 Merge to Dev

Once approved:
- Squash commits if needed
- Merge to `dev`
- Delete feature branch

### 6. Release Process

When ready for release:

```bash
# From dev, create release branch
git checkout dev
git checkout -b-release/v0.2.0

# Update version in package.json files
# Update CHANGELOG.md

# Merge to main
git checkout main
git merge release/v0.2.0

# Tag the release
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin main
git push origin v0.2.0

# Merge back to dev
git checkout dev
git merge main
git push origin dev

# Deploy to prod (production branch tracks tagged releases)
git checkout prod
git merge v0.2.0
git push origin prod
```

## 💻 Code Style

### TypeScript

- Use **strict mode** (enabled in tsconfig.json)
- Prefer `const` over `let`, avoid `var`
- Use explicit types for function parameters and returns
- Leverage type inference for variables
- Use interfaces for object shapes
- Prefer functional patterns over classes when appropriate

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

async function findUser(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}

// ❌ Avoid
async function findUser(id) {
  var user = await prisma.user.findUnique({ where: { id } });
  return user;
}
```

### NestJS Conventions

- Use **dependency injection** via constructors
- Organize code by **modules** (feature-based)
- Use **DTOs** for validation (class-validator)
- Apply **decorators** consistently (@Injectable, @Controller, etc.)
- Keep controllers thin, logic in services

**Directory structure:**
```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── guards/
│       └── jwt-auth.guard.ts
```

### React Native / Expo

- Use **functional components** with hooks
- Keep components **small and focused**
- Extract reusable logic to **custom hooks**
- Use **TypeScript** for props and state
- Follow **React best practices** (keys, memoization, etc.)

**Example:**
```typescript
interface ProfileProps {
  userId: string;
}

export function Profile({ userId }: ProfileProps) {
  const { user, loading } = useUser(userId);
  
  if (loading) return <Loading />;
  return <View>...</View>;
}
```

## 🧪 Testing

### Backend (NestJS)

```bash
# Run all tests
cd services/api
npm test

# Run tests in watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

**Test structure:**
```typescript
describe('AuthService', () => {
  it('should hash password correctly', () => {
    // Arrange
    const password = 'test123';
    
    // Act
    const hash = service.hashPassword(password);
    
    // Assert
    expect(hash).not.toBe(password);
  });
});
```

### Mobile (Expo)

```bash
cd apps/mobile
npm test
```

## 🐳 Docker & Local Development

### Start Environment

```bash
cd infra
docker compose up --build
```

### Apply Migrations

```bash
./scripts/migrate.sh migration_name
```

### View Logs

```bash
docker compose logs -f api
docker compose logs -f mobile
```

### Rebuild Single Service

```bash
docker compose up --build api
```

## 📝 Documentation

- Update README.md when adding new features
- Add JSDoc comments for complex functions
- Keep runbooks.md current with operational changes
- Update CHANGELOG.md for each release
- Document environment variables in .env.example

## 🔒 Security

### Never Commit

- Real `.env` files
- API keys or secrets
- Passwords or tokens
- Personal data

### Always

- Use `.env.example` templates
- Review .gitignore before commits
- Scan dependencies (`npm audit`)
- Follow OWASP guidelines

## 🚨 Common Issues

### Port Already in Use

```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Docker Build Fails

```bash
# Clean rebuild
docker compose down
docker system prune -a
docker compose up --build
```

### Database Migration Issues

```bash
# Reset database (⚠️ deletes data)
docker compose down -v
docker compose up -d postgres
./scripts/migrate.sh init
```

## 📮 Getting Help

- Check existing issues on GitLab/GitHub
- Review documentation in `docs/`
- Ask in team Slack channel
- Create new issue with template

## 📊 Code Review Checklist

Before requesting review, ensure:

- [ ] Code compiles without errors
- [ ] All tests pass locally
- [ ] New code has tests (aim for >80% coverage)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No console.log/debugging code
- [ ] Environment variables in .env.example
- [ ] Types are explicit (no `any`)
- [ ] Error handling implemented
- [ ] Security considerations addressed

---

Thank you for contributing to MyTsango! 🙏
