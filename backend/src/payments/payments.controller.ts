import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    RawBodyRequest,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiHeader,
    ApiBody,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import Stripe from 'stripe';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly stripeService: StripeService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('circles/:circleId/payments')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Créer un paiement pour un cercle',
        description: 'Crée un PaymentIntent Stripe pour une cotisation de cercle. Retourne un clientSecret pour confirmer le paiement côté mobile. Requiert JWT et membership du cercle.',
    })
    @ApiResponse({
        status: 201,
        description: 'Paiement créé avec succès',
        type: PaymentResponseDto,
        schema: {
            example: {
                paymentId: 'payment-uuid-123',
                clientSecret: 'pi_xxx_secret_xxx',
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not a circle member' })
    @ApiResponse({ status: 404, description: 'Circle or user not found' })
    async createPayment(
        @Param('circleId') circleId: string,
        @Request() req: any,
        @Body() dto: CreatePaymentDto,
    ): Promise<PaymentResponseDto> {
        const userId = req.user.id;
        return this.paymentsService.createPaymentIntent(circleId, userId, dto);
    }

    @Post('webhooks/stripe')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Webhook Stripe',
        description: 'Endpoint public pour recevoir les webhooks Stripe. Valide la signature HMAC et traite les événements payment_intent.succeeded/failed. Gère l\'idempotence via event.id.',
    })
    @ApiHeader({
        name: 'stripe-signature',
        description: 'Signature HMAC du webhook Stripe',
        required: true,
        example: 't=1234567890,v1=abc123...',
    })
    @ApiBody({
        description: 'Payload du webhook Stripe (raw JSON)',
        examples: {
            paymentSucceeded: {
                summary: 'Paiement réussi',
                value: {
                    type: 'payment_intent.succeeded',
                    id: 'evt_xxx',
                    data: {
                        object: {
                            id: 'pi_xxx',
                            status: 'succeeded',
                            amount: 5000,
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook traité avec succès',
        schema: {
            example: {
                success: true,
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
    async handleStripeWebhook(
        @Headers('stripe-signature') signature: string,
        @Request() req: RawBodyRequest<Request>,
    ): Promise<{ success: boolean }> {
        const rawBody = req.rawBody;
        
        if (!rawBody) {
            throw new Error('Raw body is required for Stripe webhook verification');
        }

        const event = this.stripeService.verifyWebhookSignature(
            rawBody,
            signature,
        );

        await this.paymentsService.handleStripeWebhook(event);
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':paymentId/status')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Récupérer le statut d\'un paiement',
        description: 'Retourne le statut actuel d\'un paiement (PENDING, SUCCEEDED, FAILED, REFUNDED) et l\'URL du reçu si disponible.',
    })
    @ApiResponse({
        status: 200,
        description: 'Statut du paiement',
        schema: {
            example: {
                status: 'SUCCEEDED',
                receiptUrl: 'https://s3.amazonaws.com/receipts/receipt-123.pdf',
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async getPaymentStatus(
        @Param('paymentId') paymentId: string,
        @Request() req: any,
    ): Promise<{ status: string; receiptUrl?: string }> {
        const userId = req.user.id;
        return this.paymentsService.getPaymentStatus(paymentId, userId);
    }
}

