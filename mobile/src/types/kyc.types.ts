// KYC Types
export enum KycStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface KycStatusResponse {
    status: KycStatus;
    applicantId: string | null;
    updatedAt: string;
}

export interface KycStartResponse {
    sdkAccessToken: string;
    applicantId: string;
    status?: KycStatus;
}
