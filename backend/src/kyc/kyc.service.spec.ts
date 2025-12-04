import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KycService } from './kyc.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { SumsubService } from './sumsub.service';
import { KycStatus } from '@prisma/client';

describe('KycService', () => {
    let service: KycService;
    let prisma: PrismaService;
    let metrics: MetricsService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        kycVerification: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    };

    const mockMetricsService = {
        kycRequestsTotal: { inc: jest.fn() },
        kycSuccessTotal: { inc: jest.fn() },
        kycFailureTotal: { inc: jest.fn() },
        kycDurationSeconds: { startTimer: jest.fn(() => jest.fn()) },
    };

    const mockSumsubService = {
        createApplicant: jest.fn(),
        getSdkAccessToken: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KycService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: SumsubService, useValue: mockSumsubService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<KycService>(KycService);
        prisma = module.get<PrismaService>(PrismaService);
        metrics = module.get<MetricsService>(MetricsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('startKycVerification', () => {
        it('should create new KYC verification and return SDK token', async () => {
            const userId = 'test-user-123';
            const mockUser = {
                id: userId,
                email: 'test@test.com',
                kycApplicantId: null,
                kycStatus: KycStatus.NONE,
            };
            const mockApplicant = { id: 'applicant-123', inspectionId: 'insp-123', externalUserId: userId };
            const mockToken = { token: 'sdk-token-abc', userId };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue({ ...mockUser, kycApplicantId: 'applicant-123' });
            mockPrismaService.kycVerification.create.mockResolvedValue({
                id: 'kyc-1',
                userId,
                applicantId: 'applicant-123',
                status: KycStatus.PENDING,
            });
            mockSumsubService.createApplicant.mockResolvedValue(mockApplicant);
            mockSumsubService.getSdkAccessToken.mockResolvedValue(mockToken);

            const result = await service.startKycVerification(userId);

            expect(result).toHaveProperty('sdkAccessToken');
            expect(result).toHaveProperty('applicantId');
            expect(result.sdkAccessToken).toBe('sdk-token-abc');
            expect(result.applicantId).toBe('applicant-123');
            expect(mockPrismaService.kycVerification.create).toHaveBeenCalled();
        });

        it('should return existing KYC if already started', async () => {
            const userId = 'test-user-123';
            const mockUser = {
                id: userId,
                email: 'test@test.com',
                kycApplicantId: 'existing-applicant',
                kycStatus: KycStatus.PENDING,
            };
            const mockToken = { token: 'sdk-token-xyz', userId };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockSumsubService.getSdkAccessToken.mockResolvedValue(mockToken);

            const result = await service.startKycVerification(userId);

            expect(result).toHaveProperty('sdkAccessToken');
            expect(result).toHaveProperty('applicantId');
            expect(result.applicantId).toBe('existing-applicant');
            expect(mockPrismaService.kycVerification.create).not.toHaveBeenCalled();
        });
    });

    describe('getKycStatus', () => {
        it('should return NONE status if no KYC verification exists', async () => {
            const userId = 'test-user-123';
            mockPrismaService.kycVerification.findFirst.mockResolvedValue(null);

            const result = await service.getKycStatus(userId);

            expect(result.status).toBe(KycStatus.NONE);
            expect(result.applicantId).toBeNull();
            expect(mockMetricsService.kycRequestsTotal.inc).toHaveBeenCalledWith({ endpoint: 'status' });
        });

        it('should return existing KYC status', async () => {
            const userId = 'test-user-123';
            const mockKyc = {
                id: 'kyc-1',
                userId,
                applicantId: 'applicant-123',
                status: KycStatus.APPROVED,
                updatedAt: new Date(),
            };
            mockPrismaService.kycVerification.findFirst.mockResolvedValue(mockKyc);

            const result = await service.getKycStatus(userId);

            expect(result.status).toBe(KycStatus.APPROVED);
            expect(result.applicantId).toBe('applicant-123');
        });
    });

    describe('handleWebhook', () => {
        beforeEach(() => {
            // Mock ConfigService to return undefined (dev mode - validation skipped)
            mockConfigService.get.mockReturnValue(undefined);
            process.env.NODE_ENV = 'development';
        });

        it('should update KYC status to APPROVED on GREEN review', async () => {
            const payload = {
                applicantId: 'applicant-123',
                correlationId: 'event-123',
                reviewStatus: 'completed',
                reviewResult: { reviewAnswer: 'GREEN' },
            };
            const mockKyc = {
                id: 'kyc-1',
                userId: 'user-123',
                applicantId: 'applicant-123',
                status: KycStatus.PENDING,
                webhookEventId: null,
            };

            mockPrismaService.kycVerification.findUnique.mockResolvedValue(mockKyc);
            mockPrismaService.kycVerification.update.mockResolvedValue({
                ...mockKyc,
                status: KycStatus.APPROVED,
            });
            mockPrismaService.user.update.mockResolvedValue({});

            await service.handleWebhook(payload, 'mock-signature');

            expect(mockPrismaService.kycVerification.update).toHaveBeenCalled();
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { role: 'ORGANIZER' },
            });
            expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-123',
                    action: 'kyc_approved',
                }),
            });
            expect(mockMetricsService.kycSuccessTotal.inc).toHaveBeenCalledWith({ status: 'approved' });
        });

        it('should update KYC status to REJECTED on RED review', async () => {
            const payload = {
                applicantId: 'applicant-123',
                correlationId: 'event-456',
                reviewStatus: 'completed',
                reviewResult: {
                    reviewAnswer: 'RED',
                    rejectLabels: ['DOCUMENT_MISSING'],
                },
            };
            const mockKyc = {
                id: 'kyc-1',
                userId: 'user-123',
                applicantId: 'applicant-123',
                status: KycStatus.PENDING,
                webhookEventId: null,
            };

            mockPrismaService.kycVerification.findUnique.mockResolvedValue(mockKyc);
            mockPrismaService.kycVerification.update.mockResolvedValue({
                ...mockKyc,
                status: KycStatus.REJECTED,
            });
            mockPrismaService.user.update.mockResolvedValue({});

            await service.handleWebhook(payload, 'mock-signature');

            expect(mockPrismaService.kycVerification.update).toHaveBeenCalledWith({
                where: { id: 'kyc-1' },
                data: expect.objectContaining({
                    status: KycStatus.REJECTED,
                    rejectReason: 'DOCUMENT_MISSING',
                }),
            });
            expect(mockMetricsService.kycSuccessTotal.inc).toHaveBeenCalledWith({ status: 'rejected' });
        });

        it('should handle idempotency - skip duplicate webhooks', async () => {
            const payload = {
                applicantId: 'applicant-123',
                correlationId: 'event-123',
                reviewStatus: 'completed',
                reviewResult: { reviewAnswer: 'GREEN' },
            };
            const mockKyc = {
                id: 'kyc-1',
                userId: 'user-123',
                applicantId: 'applicant-123',
                status: KycStatus.APPROVED,
                webhookEventId: 'event-123', // Already processed
            };

            mockPrismaService.kycVerification.findUnique.mockResolvedValue(mockKyc);

            await service.handleWebhook(payload, 'mock-signature');

            expect(mockPrismaService.kycVerification.update).not.toHaveBeenCalled();
            expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        });

        it('should skip webhook if KYC verification not found', async () => {
            const payload = {
                applicantId: 'unknown-applicant',
                reviewStatus: 'completed',
                reviewResult: { reviewAnswer: 'GREEN' },
            };

            mockPrismaService.kycVerification.findUnique.mockResolvedValue(null);

            await service.handleWebhook(payload, 'mock-signature');

            expect(mockPrismaService.kycVerification.update).not.toHaveBeenCalled();
        });
    });
});
