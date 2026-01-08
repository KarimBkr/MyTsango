import client from './client';
import { KycStartResponse, KycStatusResponse } from '../types/kyc.types';

export const kycApi = {
    /**
     * Start KYC verification
     * Uses JWT token from headers (set by client interceptor)
     */
    startKyc: async (): Promise<KycStartResponse> => {
        const response = await client.post<KycStartResponse>('/kyc/start');
        return response.data;
    },

    /**
     * Get KYC status
     * Uses JWT token from headers (set by client interceptor)
     */
    getKycStatus: async (): Promise<KycStatusResponse> => {
        const response = await client.get<KycStatusResponse>('/kyc/status');
        return response.data;
    },
};
