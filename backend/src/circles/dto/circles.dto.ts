import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCircleDto {
    @ApiProperty({ example: 'Tontine Famille Bakr', description: 'Nom du cercle' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Cercle d\'épargne familial', description: 'Description du cercle' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 100, description: 'Montant de la cotisation par tour en EUR' })
    @IsNumber()
    @Type(() => Number)
    @Min(10)
    amount: number;

    @ApiProperty({ example: 'monthly', enum: ['weekly', 'biweekly', 'monthly'], description: 'Fréquence des tours' })
    @IsString()
    @IsIn(['weekly', 'biweekly', 'monthly'])
    frequency: string;

    @ApiPropertyOptional({ example: 10, description: 'Nombre maximum de membres' })
    @IsNumber()
    @Type(() => Number)
    @Min(2)
    @Max(50)
    @IsOptional()
    maxMembers?: number;
}

export class InviteMemberDto {
    @ApiProperty({ example: 'member@example.com', description: 'Email du membre à inviter' })
    @IsString()
    email: string;
}

export class JoinCircleDto {
    @ApiPropertyOptional({ example: 'code123', description: 'Code d\'invitation (optionnel)' })
    @IsString()
    @IsOptional()
    inviteCode?: string;
}

export class CircleResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    frequency: string;

    @ApiProperty()
    maxMembers: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    organizerId: string;

    @ApiPropertyOptional()
    startDate?: Date;

    @ApiPropertyOptional()
    endDate?: Date;

    @ApiProperty()
    memberCount: number;

    @ApiProperty()
    currentRound?: number;
}

export class CircleMemberResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    position: number;

    @ApiProperty()
    role: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    joinedAt: Date;
}

export class RoundResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    number: number;

    @ApiProperty()
    recipientId: string;

    @ApiProperty()
    recipientEmail: string;

    @ApiProperty()
    status: string;

    @ApiPropertyOptional()
    totalAmount?: number;

    @ApiProperty()
    dueDate: Date;

    @ApiPropertyOptional()
    completedAt?: Date;

    @ApiProperty()
    contributionsCount: number;

    @ApiProperty()
    paidCount: number;
}
