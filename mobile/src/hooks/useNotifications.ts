import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { useAuth } from '../contexts/AuthContext';

// Configuration des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const useNotifications = () => {
    const { isAuthenticated } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    // Mutation pour mettre à jour le token sur le backend
    const updateTokenMutation = useMutation({
        mutationFn: (token: string) => notificationsApi.updatePushToken({ pushToken: token }),
        onSuccess: () => {
            console.log('Push token updated on backend');
        },
        onError: (error: any) => {
            console.error('Failed to update push token:', error);
        },
    });

    // Enregistrer le token Expo et l'envoyer au backend
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let isMounted = true;

        const registerForPushNotifications = async () => {
            try {
                // Demander les permissions
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.warn('Failed to get push token for push notification!');
                    return;
                }

                // Récupérer le token Expo
                const token = await Notifications.getExpoPushTokenAsync();

                if (!isMounted) return;

                const pushToken = token.data;
                setExpoPushToken(pushToken);
                setIsRegistered(true);

                // Envoyer le token au backend
                updateTokenMutation.mutate(pushToken);
            } catch (error: any) {
                console.error('Error registering for push notifications:', error);
            }
        };

        registerForPushNotifications();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    return {
        expoPushToken,
        isRegistered,
        isUpdating: updateTokenMutation.isPending,
    };
};

