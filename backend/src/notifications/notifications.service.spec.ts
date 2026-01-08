import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NotificationsService', () => {
    let service: NotificationsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Note: sendExpoPushNotification est une méthode privée, testée via les méthodes publiques

    describe('sendInvitationNotification', () => {
        it('should send invitation notification if user has push token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                expoPushToken: 'ExponentPushToken[test123]',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedAxios.post.mockResolvedValue({
                data: {
                    data: [{ status: 'ok' }],
                },
            });

            await service.sendInvitationNotification('user-123', 'circle-456');

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://exp.host/--/api/v2/push/send',
                expect.objectContaining({
                    to: 'ExponentPushToken[test123]',
                    title: 'Nouvelle invitation',
                }),
            );
        });

        it('should skip notification if user has no push token', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                expoPushToken: null,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await service.sendInvitationNotification('user-123', 'circle-456');

            expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
            expect(mockedAxios.post).not.toHaveBeenCalled();
        });

        it('should not throw if notification fails', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                expoPushToken: 'ExponentPushToken[test123]',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedAxios.post.mockRejectedValue(new Error('Network error'));

            // Should not throw
            await expect(
                service.sendInvitationNotification('user-123', 'circle-456'),
            ).resolves.not.toThrow();
        });
    });

    describe('sendPaymentDueNotification', () => {
        it('should send payment due notification', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                expoPushToken: 'ExponentPushToken[test123]',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedAxios.post.mockResolvedValue({
                data: {
                    data: [{ status: 'ok' }],
                },
            });

            const dueDate = new Date('2025-12-31');

            await service.sendPaymentDueNotification('user-123', 'circle-456', dueDate);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
            expect(mockedAxios.post).toHaveBeenCalled();
        });
    });

    describe('sendPaymentSuccessNotification', () => {
        it('should send payment success notification', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                expoPushToken: 'ExponentPushToken[test123]',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockedAxios.post.mockResolvedValue({
                data: {
                    data: [{ status: 'ok' }],
                },
            });

            await service.sendPaymentSuccessNotification('user-123', 'payment-789');

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    title: 'Paiement confirmé',
                    body: 'Votre paiement a été traité avec succès',
                    data: expect.objectContaining({
                        type: 'PAYMENT_SUCCESS',
                        paymentId: 'payment-789',
                    }),
                }),
            );
        });
    });

    describe('updatePushToken', () => {
        it('should update push token for user', async () => {
            mockPrismaService.user.update.mockResolvedValue({
                id: 'user-123',
                expoPushToken: 'ExponentPushToken[new123]',
            });

            await service.updatePushToken('user-123', 'ExponentPushToken[new123]');

            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { expoPushToken: 'ExponentPushToken[new123]' },
            });
        });

        it('should throw error if update fails', async () => {
            mockPrismaService.user.update.mockRejectedValue(new Error('Database error'));

            await expect(
                service.updatePushToken('user-123', 'ExponentPushToken[new123]'),
            ).rejects.toThrow('Database error');
        });
    });
});

