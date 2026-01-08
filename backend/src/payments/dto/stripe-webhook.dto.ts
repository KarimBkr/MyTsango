import { ApiProperty } from '@nestjs/swagger';

export class StripeWebhookDto {
    @ApiProperty({
        description: 'Type d\'événement Stripe',
        example: 'payment_intent.succeeded',
    })
    type: string;

    @ApiProperty({
        description: 'ID unique de l\'événement (pour idempotence)',
        example: 'evt_xxx',
    })
    id: string;

    @ApiProperty({
        description: 'Données de l\'événement',
    })
    data: {
        object: {
            id: string; // payment_intent.id
            status: string;
            amount: number;
            metadata?: {
                circleId?: string;
                userId?: string;
                paymentId?: string;
            };
        };
    };
}

