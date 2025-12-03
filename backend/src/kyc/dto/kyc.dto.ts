import { KycStatus } from '@prisma/client';

export class KycStartResponseDto {
    token: string;
    applicantId: string;
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
