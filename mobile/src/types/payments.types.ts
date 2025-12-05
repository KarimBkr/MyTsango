// Payment Types
export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export interface CreatePaymentRequest {
    amount: number;
}

export interface CreatePaymentResponse {
    paymentId: string;
    clientSecret: string;
}

export interface PaymentStatusResponse {
    status: PaymentStatus;
    receiptUrl?: string;
}

