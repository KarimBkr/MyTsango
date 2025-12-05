import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { CreatePaymentRequest, CreatePaymentResponse, PaymentStatusResponse } from '../types/payments.types';

export const usePayments = (circleId?: string) => {
    const queryClient = useQueryClient();

    const createPaymentMutation = useMutation<CreatePaymentResponse, Error, CreatePaymentRequest>({
        mutationFn: (data: CreatePaymentRequest) => {
            if (!circleId) {
                throw new Error('Circle ID is required');
            }
            return paymentsApi.createPayment(circleId, data);
        },
        onSuccess: (data) => {
            console.log('Payment created successfully:', data);
            // Invalider les queries de paiements si nécessaire
            queryClient.invalidateQueries({ queryKey: ['payments', circleId] });
        },
        onError: (error) => {
            console.error('Failed to create payment:', error);
        },
    });

    const getPaymentStatus = (paymentId: string) => {
        return useQuery<PaymentStatusResponse>({
            queryKey: ['paymentStatus', paymentId],
            queryFn: () => paymentsApi.getPaymentStatus(paymentId),
            enabled: !!paymentId,
        });
    };

    return {
        createPayment: createPaymentMutation.mutate,
        createPaymentAsync: createPaymentMutation.mutateAsync,
        isCreating: createPaymentMutation.isPending,
        createError: createPaymentMutation.error,
        getPaymentStatus,
    };
};

