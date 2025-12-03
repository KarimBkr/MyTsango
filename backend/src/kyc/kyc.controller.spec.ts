import { Test, TestingModule } from '@nestjs/testing';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycStatus } from '@prisma/client';

describe('KycController', () => {
    let controller: KycController;
    let service: KycService;

    const mockKycService = {
        startKycVerification: jest.fn(),
        getKycStatus: jest.fn(),
        handleWebhook: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [KycController],
            providers: [{ provide: KycService, useValue: mockKycService }],
        }).compile();

        controller = module.get<KycController>(KycController);
        service = module.get<KycService>(KycService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('startKyc', () => {
        it('should call service and return token and applicantId', async () => {
            const userId = 'test-user-123';
            const mockResponse = {
                token: 'mock-token-xyz',
                applicantId: 'mock-applicant-456',
            };
            mockKycService.startKycVerification.mockResolvedValue(mockResponse);

            const result = await controller.startKyc(userId);

            expect(service.startKycVerification).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getKycStatus', () => {
        it('should call service and return KYC status', async () => {
            const userId = 'test-user-123';
            const mockStatus = {
                status: KycStatus.APPROVED,
                applicantId: 'applicant-123',
                updatedAt: new Date(),
            };
            mockKycService.getKycStatus.mockResolvedValue(mockStatus);

            const result = await controller.getKycStatus(userId);

            expect(service.getKycStatus).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockStatus);
        });
    });

    describe('handleSumsubWebhook', () => {
        it('should call service with payload and signature', async () => {
            const payload = {
                applicantId: 'applicant-123',
                reviewStatus: 'completed',
                reviewResult: { reviewAnswer: 'GREEN' },
            };
            const signature = 'hmac-signature-xyz';
            mockKycService.handleWebhook.mockResolvedValue(undefined);

            const result = await controller.handleSumsubWebhook(payload, signature);

            expect(service.handleWebhook).toHaveBeenCalledWith(payload, signature);
            expect(result).toEqual({ success: true });
        });
    });
});
