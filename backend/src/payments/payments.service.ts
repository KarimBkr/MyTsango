import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { StripeService } from './stripe/stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly metrics: MetricsService,
        private readonly stripeService: StripeService,
        private readonly notificationsService: NotificationsService,
    ) {}

    /**
     * Crée un PaymentIntent pour un cercle
     * ⚠️ DÉPENDANCE JIHAD: Vérifie que l'utilisateur est membre du cercle
     */
    async createPaymentIntent(
        circleId: string,
        userId: string,
        dto: CreatePaymentDto,
    ): Promise<PaymentResponseDto> {
        const timer = this.metrics.paymentsDurationSeconds?.startTimer({ operation: 'create' });
        this.metrics.paymentsTotal?.inc({ status: 'created' });

        try {
            this.logger.log(`Creating payment for circle ${circleId}, user ${userId}, amount: ${dto.amount}€`);

            // 🚨 DÉPENDANCE JIHAD: Vérifier que l'utilisateur est membre du cercle
            // TODO: Décommenter après que Jihad ait créé le modèle CircleMember
            // const membership = await this.prisma.circleMember.findFirst({
            //     where: { circleId, userId },
            // });
            // if (!membership) {
            //     throw new ForbiddenException('Vous n\'êtes pas membre de ce cercle');
            // }

            // Pour l'instant, on vérifie juste que l'utilisateur existe
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new NotFoundException('Utilisateur introuvable');
            }

            // Vérifier que le cercle existe (temporaire, en attendant Jihad)
            // TODO: Décommenter après modèle Circle
            // const circle = await this.prisma.circle.findUnique({ where: { id: circleId } });
            // if (!circle) {
            //     throw new NotFoundException('Cercle introuvable');
            // }

            // Créer PaymentIntent Stripe (montant en centimes)
            const amountInCents = Math.round(dto.amount * 100);
            const paymentIntent = await this.stripeService.createPaymentIntent(
                amountInCents,
                `Cotisation cercle ${circleId}`,
                {
                    circleId,
                    userId,
                },
            );

            // Sauvegarder le paiement en DB
            const payment = await this.prisma.payment.create({
                data: {
                    circleId,
                    userId,
                    amount: dto.amount,
                    stripePaymentIntentId: paymentIntent.id,
                    status: PaymentStatus.PENDING,
                },
            });

            this.metrics.paymentsSuccessTotal?.inc({ status: 'created' });
            this.logger.log(`Payment created: ${payment.id} for PaymentIntent ${paymentIntent.id}`);

            return {
                paymentId: payment.id,
                clientSecret: paymentIntent.client_secret || '',
            };
        } catch (error: any) {
            this.metrics.paymentsFailureTotal?.inc({ reason: 'create_error' });
            this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
            throw error;
        } finally {
            timer?.();
        }
    }

    /**
     * Traite un webhook Stripe
     */
    async handleStripeWebhook(event: Stripe.Event): Promise<void> {
        const timer = this.metrics.paymentsDurationSeconds?.startTimer({ operation: 'webhook' });
        this.metrics.paymentsTotal?.inc({ status: 'webhook' });

        try {
            this.logger.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

            // Vérifier l'idempotence (éviter les doublons)
            const existingEvent = await this.prisma.auditLog.findFirst({
                where: {
                    action: 'STRIPE_WEBHOOK',
                    details: { path: ['eventId'], equals: event.id } as any,
                },
            });

            if (existingEvent) {
                this.logger.log(`Webhook already processed: ${event.id}`);
                return;
            }

            // Traiter selon le type d'événement
            if (event.type === 'payment_intent.succeeded') {
                await this.handlePaymentSucceeded(event);
            } else if (event.type === 'payment_intent.payment_failed') {
                await this.handlePaymentFailed(event);
            } else {
                this.logger.log(`Unhandled webhook event type: ${event.type}`);
            }

            // Enregistrer l'événement dans audit log
            await this.prisma.auditLog.create({
                data: {
                    action: 'STRIPE_WEBHOOK',
                    details: {
                        eventId: event.id,
                        eventType: event.type,
                    },
                },
            });

            this.metrics.paymentsSuccessTotal?.inc({ status: 'webhook_processed' });
        } catch (error: any) {
            this.metrics.paymentsFailureTotal?.inc({ reason: 'webhook_error' });
            this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
            throw error;
        } finally {
            timer?.();
        }
    }

    /**
     * Gère un paiement réussi
     */
    private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        this.logger.log(`Payment succeeded: ${paymentIntentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
        });

        if (!payment) {
            this.logger.warn(`Payment not found for PaymentIntent ${paymentIntentId}`);
            return;
        }

        if (payment.status === PaymentStatus.SUCCEEDED) {
            this.logger.log(`Payment ${payment.id} already marked as succeeded`);
            return;
        }

        // Mettre à jour le statut
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.SUCCEEDED,
                confirmedAt: new Date(),
            },
        });

        this.logger.log(`Payment ${payment.id} marked as succeeded`);
        this.metrics.paymentsSuccessTotal?.inc({ status: 'succeeded' });

        // Envoyer notification push à l'utilisateur
        try {
            await this.notificationsService.sendPaymentSuccessNotification(
                payment.userId,
                payment.id,
            );
        } catch (error: any) {
            // Ne pas bloquer le flux si la notification échoue
            this.logger.warn(`Failed to send payment success notification: ${error.message}`);
        }

        // TODO: Générer le reçu PDF et l'uploader sur S3/MinIO
    }

    /**
     * Gère un paiement échoué
     */
    private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        this.logger.log(`Payment failed: ${paymentIntentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
        });

        if (!payment) {
            this.logger.warn(`Payment not found for PaymentIntent ${paymentIntentId}`);
            return;
        }

        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.FAILED,
            },
        });

        this.logger.log(`Payment ${payment.id} marked as failed`);
        this.metrics.paymentsFailureTotal?.inc({ reason: 'payment_failed' });
    }

    /**
     * Récupère le statut d'un paiement
     */
    async getPaymentStatus(paymentId: string, userId: string): Promise<{ status: PaymentStatus; receiptUrl?: string }> {
        const payment = await this.prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId, // Vérifier que le paiement appartient à l'utilisateur
            },
        });

        if (!payment) {
            throw new NotFoundException('Paiement introuvable');
        }

        return {
            status: payment.status,
            receiptUrl: payment.receiptUrl || undefined,
        };
    }
}

