import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe/stripe.service';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

describe('PaymentsController', () => {
    let controller: PaymentsController;
    let service: PaymentsService;
    let stripeService: StripeService;

    const mockPaymentsService = {
        createPaymentIntent: jest.fn(),
        getPaymentStatus: jest.fn(),
        handleStripeWebhook: jest.fn(),
    };

    const mockStripeService = {
        verifyWebhookSignature: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentsController],
            providers: [
                {
                    provide: PaymentsService,
                    useValue: mockPaymentsService,
                },
                {
                    provide: StripeService,
                    useValue: mockStripeService,
                },
            ],
        }).compile();

        controller = module.get<PaymentsController>(PaymentsController);
        service = module.get<PaymentsService>(PaymentsService);
        stripeService = module.get<StripeService>(StripeService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPayment', () => {
        it('should create payment intent and return clientSecret', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const circleId = 'circle-123';
            const dto = { amount: 50 };
            const mockResponse = {
                paymentId: 'payment-123',
                clientSecret: 'pi_xxx_secret_xxx',
            };

            mockPaymentsService.createPaymentIntent.mockResolvedValue(mockResponse);

            const result = await controller.createPayment(circleId, mockRequest, dto);

            expect(service.createPaymentIntent).toHaveBeenCalledWith(circleId, 'test-user-123', dto);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('handleStripeWebhook', () => {
        it('should verify signature and process webhook', async () => {
            const signature = 'stripe-signature-xyz';
            const rawBody = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
            const mockRequest = {
                rawBody,
            } as any;

            const mockEvent: Stripe.Event = {
                id: 'evt_xxx',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_xxx',
                        status: 'succeeded',
                    } as Stripe.PaymentIntent,
                },
            } as Stripe.Event;

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
            mockPaymentsService.handleStripeWebhook.mockResolvedValue(undefined);

            const result = await controller.handleStripeWebhook(signature, mockRequest);

            expect(stripeService.verifyWebhookSignature).toHaveBeenCalledWith(rawBody, signature);
            expect(service.handleStripeWebhook).toHaveBeenCalledWith(mockEvent);
            expect(result).toEqual({ success: true });
        });

        it('should throw error if rawBody is missing', async () => {
            const signature = 'stripe-signature-xyz';
            const mockRequest = {} as any;

            await expect(controller.handleStripeWebhook(signature, mockRequest)).rejects.toThrow(
                'Raw body is required',
            );
        });
    });

    describe('getPaymentStatus', () => {
        it('should return payment status', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const paymentId = 'payment-123';
            const mockStatus = {
                status: PaymentStatus.SUCCEEDED,
                receiptUrl: 'https://s3.amazonaws.com/receipt.pdf',
            };

            mockPaymentsService.getPaymentStatus.mockResolvedValue(mockStatus);

            const result = await controller.getPaymentStatus(paymentId, mockRequest);

            expect(service.getPaymentStatus).toHaveBeenCalledWith(paymentId, 'test-user-123');
            expect(result).toEqual(mockStatus);
        });

        it('should return status without receiptUrl if not available', async () => {
            const mockUser = { id: 'test-user-123', email: 'test@test.com' };
            const mockRequest = { user: mockUser };
            const paymentId = 'payment-123';
            const mockStatus = {
                status: PaymentStatus.PENDING,
            };

            mockPaymentsService.getPaymentStatus.mockResolvedValue(mockStatus);

            const result = await controller.getPaymentStatus(paymentId, mockRequest);

            expect(result).toEqual(mockStatus);
        });
    });
});

