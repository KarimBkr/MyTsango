import client from './client';
import { KycStartResponse, KycStatusResponse } from '../types/kyc.types';

export const kycApi = {
    /**
     * Start KYC verification
     * Phase 1: Uses userId query param
     * Phase 2: Will use JWT token from headers
     */
    startKyc: async (userId: string): Promise<KycStartResponse> => {
        const response = await client.post<KycStartResponse>(`/kyc/start?userId=${userId}`);
        return response.data;
    },

    /**
     * Get KYC status
     * Phase 1: Uses userId query param
     * Phase 2: Will use JWT token from headers
     */
    getKycStatus: async (userId: string): Promise<KycStatusResponse> => {
        const response = await client.get<KycStatusResponse>(`/kyc/status?userId=${userId}`);
        return response.data;
    },
};
