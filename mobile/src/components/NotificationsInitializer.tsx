import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Composant qui initialise les notifications push
 * S'exécute automatiquement quand l'utilisateur est connecté
 */
export const NotificationsInitializer: React.FC = () => {
    useNotifications();
    return null; // Ce composant ne rend rien
};

