import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Montant du paiement en euros',
        example: 50.0,
        minimum: 5,
        maximum: 500,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(5, { message: 'Le montant minimum est de 5€' })
    @Max(500, { message: 'Le montant maximum est de 500€' })
    amount: number;
}

