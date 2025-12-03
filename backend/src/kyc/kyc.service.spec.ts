import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { KycStatus } from '@prisma/client';

describe('KycService', () => {
    let service: KycService;
    let prisma: PrismaService;
    let metrics: MetricsService;

    const mockPrismaService = {
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KycService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: MetricsService, useValue: mockMetricsService },
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
        it('should create new KYC verification and return mock token', async () => {
            const userId = 'test-user-123';
            mockPrismaService.kycVerification.findFirst.mockResolvedValue(null);
            mockPrismaService.kycVerification.create.mockResolvedValue({
                id: 'kyc-1',
                userId,
                applicantId: 'mock-applicant-123',
                status: KycStatus.PENDING,
            });

            const result = await service.startKycVerification(userId);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('applicantId');
            expect(result.token).toContain('mock-sdk-token');
            expect(result.applicantId).toContain('mock-applicant');
            expect(mockPrismaService.kycVerification.create).toHaveBeenCalled();
            expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    action: 'kyc_started',
                }),
            });
            expect(mockMetricsService.kycRequestsTotal.inc).toHaveBeenCalledWith({ endpoint: 'start' });
            expect(mockMetricsService.kycSuccessTotal.inc).toHaveBeenCalledWith({ status: 'started' });
        });

        it('should return existing KYC if already started', async () => {
            const userId = 'test-user-123';
            mockPrismaService.kycVerification.findFirst.mockResolvedValue({
                id: 'kyc-1',
                userId,
                applicantId: 'existing-applicant',
                status: KycStatus.PENDING,
            });

            const result = await service.startKycVerification(userId);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('applicantId');
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

            await service.handleWebhook(payload, 'mock-signature');

            expect(mockPrismaService.kycVerification.update).toHaveBeenCalledWith({
                where: { id: 'kyc-1' },
                data: expect.objectContaining({
                    status: KycStatus.APPROVED,
                    reviewStatus: 'completed',
                    webhookEventId: 'event-123',
                }),
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
