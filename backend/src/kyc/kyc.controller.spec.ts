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
        it('should call service and return SDK token and applicantId', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const mockResponse = {
                sdkAccessToken: 'mock-token-xyz',
                applicantId: 'mock-applicant-456',
                status: KycStatus.PENDING,
            };
            mockKycService.startKycVerification.mockResolvedValue(mockResponse);

            const result = await controller.startKyc(mockRequest);

            expect(service.startKycVerification).toHaveBeenCalledWith('test-user-123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getKycStatus', () => {
        it('should call service and return KYC status', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const mockStatus = {
                status: KycStatus.APPROVED,
                applicantId: 'applicant-123',
                updatedAt: new Date(),
            };
            mockKycService.getKycStatus.mockResolvedValue(mockStatus);

            const result = await controller.getKycStatus(mockRequest);

            expect(service.getKycStatus).toHaveBeenCalledWith('test-user-123');
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
