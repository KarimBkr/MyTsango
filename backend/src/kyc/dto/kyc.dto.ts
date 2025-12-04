import { KycStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class KycStartResponseDto {
    @ApiProperty({ example: 'sumsub-applicant-id-123' })
    applicantId: string;

    @ApiProperty({ example: 'sumsub-sdk-token-abc123' })
    sdkAccessToken: string;

    @ApiProperty({ enum: KycStatus, example: KycStatus.PENDING })
    status: KycStatus;
}

export class KycStatusResponseDto {
    status: KycStatus;
    applicantId: string | null;
    updatedAt: Date;
}

export class SumsubWebhookDto {
    applicantId: string;
    inspectionId?: string;
    correlationId?: string;
    externalUserId?: string;
    type?: string;
    reviewStatus?: string;
    reviewResult?: {
        reviewAnswer?: string;
        rejectLabels?: string[];
        reviewRejectType?: string;
    };
    createdAt?: string;
}
