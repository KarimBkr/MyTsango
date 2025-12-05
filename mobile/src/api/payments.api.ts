import client from './client';
import { CreatePaymentRequest, CreatePaymentResponse, PaymentStatusResponse } from '../types/payments.types';

export const paymentsApi = {
    createPayment: async (circleId: string, data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
        const response = await client.post<CreatePaymentResponse>(`/payments/circles/${circleId}/payments`, data);
        return response.data;
    },

    getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResponse> => {
        const response = await client.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
        return response.data;
    },
};

