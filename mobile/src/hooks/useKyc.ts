import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '../api/kyc.api';
import { KycStatusResponse, KycStartResponse } from '../types/kyc.types';

export const useKyc = (userId: string) => {
    const queryClient = useQueryClient();

    // Query for KYC status
    const {
        data: kycStatus,
        isLoading: isLoadingStatus,
        error: statusError,
        refetch,
    } = useQuery<KycStatusResponse>({
        queryKey: ['kycStatus', userId],
        queryFn: () => kycApi.getKycStatus(userId),
        enabled: !!userId,
    });

    // Mutation for starting KYC
    const startKycMutation = useMutation<KycStartResponse, Error, void>({
        mutationFn: () => kycApi.startKyc(userId),
        onSuccess: (data) => {
            console.log('KYC started successfully:', data);
            // Invalidate and refetch status
            queryClient.invalidateQueries({ queryKey: ['kycStatus', userId] });
        },
        onError: (error) => {
            console.error('Failed to start KYC:', error);
        },
    });

    return {
        kycStatus,
        isLoadingStatus,
        statusError,
        refetch,
        startKyc: startKycMutation.mutate,
        startKycAsync: startKycMutation.mutateAsync,
        isStarting: startKycMutation.isPending,
        startError: startKycMutation.error,
    };
};
