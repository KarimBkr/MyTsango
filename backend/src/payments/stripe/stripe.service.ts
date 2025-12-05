import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private readonly stripe: Stripe;

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        
        if (!secretKey) {
            this.logger.warn('STRIPE_SECRET_KEY not configured, StripeService will not work');
        }

        this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
            apiVersion: '2025-11-17.clover',
        });
    }

    /**
     * Crée un PaymentIntent Stripe
     * @param amount Montant en centimes (ex: 5000 = 50.00€)
     * @param description Description du paiement
     * @param metadata Métadonnées additionnelles
     */
    async createPaymentIntent(
        amount: number,
        description: string,
        metadata?: Record<string, string>,
    ): Promise<Stripe.PaymentIntent> {
        try {
            this.logger.log(`Creating PaymentIntent for ${amount} cents: ${description}`);

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount,
                currency: 'eur',
                description,
                metadata: metadata || {},
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
            return paymentIntent;
        } catch (error: any) {
            this.logger.error(`Failed to create PaymentIntent: ${error.message}`, error.stack);
            throw new BadRequestException(`Erreur lors de la création du paiement: ${error.message}`);
        }
    }

    /**
     * Récupère un PaymentIntent par son ID
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error: any) {
            this.logger.error(`Failed to retrieve PaymentIntent ${paymentIntentId}: ${error.message}`);
            throw new BadRequestException(`Paiement introuvable: ${error.message}`);
        }
    }

    /**
     * Vérifie la signature d'un webhook Stripe
     */
    verifyWebhookSignature(
        payload: string | Buffer,
        signature: string,
    ): Stripe.Event {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            this.logger.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
            // En développement, on peut accepter sans vérification
            if (process.env.NODE_ENV === 'development') {
                return JSON.parse(payload.toString());
            }
            throw new BadRequestException('Webhook secret not configured');
        }

        try {
            return this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret,
            );
        } catch (error: any) {
            this.logger.error(`Webhook signature verification failed: ${error.message}`);
            throw new BadRequestException(`Signature invalide: ${error.message}`);
        }
    }
}

