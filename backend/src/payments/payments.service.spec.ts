import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { StripeService } from './stripe/stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentStatus } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prisma: PrismaService;
    let metrics: MetricsService;
    let stripeService: StripeService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
        },
        payment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        auditLog: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        // TODO: Décommenter après modèle Circle de Jihad
        // circleMember: {
        //     findFirst: jest.fn(),
        // },
    };

    const mockMetricsService = {
        paymentsTotal: { inc: jest.fn() },
        paymentsSuccessTotal: { inc: jest.fn() },
        paymentsFailureTotal: { inc: jest.fn() },
        paymentsDurationSeconds: { startTimer: jest.fn(() => jest.fn()) },
    };

    const mockStripeService = {
        createPaymentIntent: jest.fn(),
        verifyWebhookSignature: jest.fn(),
    };

    const mockNotificationsService = {
        sendPaymentSuccessNotification: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: StripeService, useValue: mockStripeService },
                { provide: NotificationsService, useValue: mockNotificationsService },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
        prisma = module.get<PrismaService>(PrismaService);
        metrics = module.get<MetricsService>(MetricsService);
        stripeService = module.get<StripeService>(StripeService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPaymentIntent', () => {
        const circleId = 'circle-123';
        const userId = 'user-123';
        const dto = { amount: 50 };

        it('should create payment intent successfully', async () => {
            const mockUser = { id: userId, email: 'test@example.com' };
            const mockPaymentIntent = {
                id: 'pi_xxx',
                client_secret: 'pi_xxx_secret_xxx',
            };
            const mockPayment = {
                id: 'payment-123',
                circleId,
                userId,
                amount: 50,
                stripePaymentIntentId: 'pi_xxx',
                status: PaymentStatus.PENDING,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
            mockPrismaService.payment.create.mockResolvedValue(mockPayment);

            const result = await service.createPaymentIntent(circleId, userId, dto);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
            expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
                5000, // 50€ en centimes
                `Cotisation cercle ${circleId}`,
                { circleId, userId },
            );
            expect(mockPrismaService.payment.create).toHaveBeenCalledWith({
                data: {
                    circleId,
                    userId,
                    amount: 50,
                    stripePaymentIntentId: 'pi_xxx',
                    status: PaymentStatus.PENDING,
                },
            });
            expect(result).toEqual({
                paymentId: 'payment-123',
                clientSecret: 'pi_xxx_secret_xxx',
            });
            expect(mockMetricsService.paymentsTotal.inc).toHaveBeenCalledWith({ status: 'created' });
            expect(mockMetricsService.paymentsSuccessTotal.inc).toHaveBeenCalledWith({ status: 'created' });
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.createPaymentIntent(circleId, userId, dto)).rejects.toThrow(NotFoundException);
            expect(mockMetricsService.paymentsFailureTotal.inc).toHaveBeenCalledWith({ reason: 'create_error' });
        });
    });

    describe('handleStripeWebhook', () => {
        const mockEvent = {
            id: 'evt_xxx',
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_xxx',
                    status: 'succeeded',
                    amount: 5000,
                },
            },
        } as any;

        it('should handle payment succeeded webhook', async () => {
            const mockPayment = {
                id: 'payment-123',
                circleId: 'circle-123',
                userId: 'user-123',
                status: PaymentStatus.PENDING,
            };

            mockPrismaService.auditLog.findFirst.mockResolvedValue(null);
            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrismaService.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCEEDED });
            mockPrismaService.auditLog.create.mockResolvedValue({});

            await service.handleStripeWebhook(mockEvent);

            expect(mockPrismaService.payment.findUnique).toHaveBeenCalledWith({
                where: { stripePaymentIntentId: 'pi_xxx' },
            });
            expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
                where: { id: 'payment-123' },
                data: {
                    status: PaymentStatus.SUCCEEDED,
                    confirmedAt: expect.any(Date),
                },
            });
            expect(mockMetricsService.paymentsSuccessTotal.inc).toHaveBeenCalledWith({ status: 'succeeded' });
        });

        it('should skip if webhook already processed (idempotence)', async () => {
            mockPrismaService.auditLog.findFirst.mockResolvedValue({ id: 'existing-log' });

            await service.handleStripeWebhook(mockEvent);

            expect(mockPrismaService.payment.findUnique).not.toHaveBeenCalled();
        });
    });

    describe('getPaymentStatus', () => {
        it('should return payment status', async () => {
            const paymentId = 'payment-123';
            const userId = 'user-123';
            const mockPayment = {
                id: paymentId,
                userId,
                status: PaymentStatus.SUCCEEDED,
                receiptUrl: 'https://s3.amazonaws.com/receipt.pdf',
            };

            mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

            const result = await service.getPaymentStatus(paymentId, userId);

            expect(result).toEqual({
                status: PaymentStatus.SUCCEEDED,
                receiptUrl: 'https://s3.amazonaws.com/receipt.pdf',
            });
        });

        it('should throw NotFoundException if payment not found', async () => {
            mockPrismaService.payment.findFirst.mockResolvedValue(null);

            await expect(service.getPaymentStatus('invalid-id', 'user-123')).rejects.toThrow(NotFoundException);
        });
    });
});

