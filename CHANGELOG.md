# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-03

### Added - Initial Bootstrap

#### Project Structure
- Created monorepo structure with `apps/` (mobile) and `services/` (API)
- Set up infrastructure directory with Docker configurations
- Added utility scripts for migrations and JWT generation
- Created comprehensive documentation in `docs/`

#### Mobile Application (Expo/React Native)
- Initialized Expo application with TypeScript
- Set up React Navigation with stack navigator
- Created basic authentication hook (scaffold)
- Configured API client service
- Added Babel and TypeScript configurations

#### Backend API (NestJS)
- Created NestJS application with modular architecture
- Implemented Prisma ORM with User and KycVerification models
- Configured Swagger UI for API documentation (`/api-docs`)
- Added security middleware: Helmet and CORS
- Implemented global ValidationPipe for DTO validation
- Created Prometheus metrics endpoint (`/metrics`)
- Scaffolded Auth, Users, and KYC modules

#### Infrastructure (Docker)
- Docker Compose configuration with 11 services:
  - API (NestJS backend)
  - Mobile (Expo development server)
  - PostgreSQL (database)
  - Redis (cache/queue)
  - MinIO (S3-compatible object storage)
  - Stripe CLI (webhook forwarding)
  - Ngrok (public tunnel)
  - Prometheus (metrics collection)
  - Grafana (metrics visualization)
  - pgAdmin (database administration)
- Multi-stage Dockerfiles for optimized builds
- Persistent volumes for database and storage
- Service networking configuration

#### Monitoring & Observability
- Prometheus scraping configuration
- Grafana dashboard setup
- Basic health metrics endpoint

#### CI/CD
- GitLab CI pipeline with lint, test, and build stages
- Docker-in-Docker build verification

#### Documentation
- README with setup instructions
- Runbooks for operational procedures
- Environment variable documentation (`.env.example`)
- Data retention policy placeholder
- Terms of service placeholder
- Community charter placeholder

#### Development Tools
- Database migration script (`migrate.sh`)
- JWT generation script (`generate-jwt.sh`)
- Git ignore configuration
- Environment file templates

### Technical Details
- **Languages**: TypeScript (mobile & backend)
- **Frameworks**: Expo 49.x, NestJS 10.x
- **Database**: PostgreSQL 13 with Prisma ORM 5.x
- **Container**: Docker Compose 3.9
- **Monitoring**: Prometheus + Grafana
- **Documentation**: Swagger/OpenAPI 3.0

### Known Issues
- Stripe webhook secret must be manually captured from logs
- Ngrok URL regenerates on each restart (free tier)
- Mobile app requires manual IP configuration for physical devices
- Some dependency vulnerabilities reported (non-critical)

### Security Notes
- Development mode with default credentials
- CORS open to all origins
- No rate limiting implemented
- Intended for local development only

---

## Future Releases

### Planned for v0.2.0
- Authentication implementation (JWT, refresh tokens)
- User management endpoints
- Password hashing and validation
- Email verification

### Planned for v0.3.0
- KYC integration with SumSub
- Document upload to MinIO
- Webhook handlers for external services

### Planned for v0.4.0
- Stripe payment integration
- Subscription management
- Webhook signature verification

---

[0.1.0]: https://github.com/yourorg/MyTsango/releases/tag/v0.1.0
