import client from './client';

export interface UpdatePushTokenRequest {
    pushToken: string;
}

export interface UpdatePushTokenResponse {
    success: boolean;
}

export const notificationsApi = {
    updatePushToken: async (dto: UpdatePushTokenRequest): Promise<UpdatePushTokenResponse> => {
        const response = await client.post<UpdatePushTokenResponse>('/notifications/push-token', dto);
        return response.data;
    },
};

