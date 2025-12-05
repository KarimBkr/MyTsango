import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
    @ApiProperty({
        description: 'ID du paiement créé',
        example: 'payment-uuid-123',
    })
    paymentId: string;

    @ApiProperty({
        description: 'Client secret Stripe pour confirmer le paiement côté client',
        example: 'pi_xxx_secret_xxx',
    })
    clientSecret: string;
}

