import { useState } from 'react';

// Hook d'authentification (exemple placeholder)
export function useAuth() {
    // Par exemple, un state pour indiquer si l'utilisateur est connecté
    const [isAuthenticated, setAuthenticated] = useState(false);
    // TODO: implémenter la logique d'authentification plus tard
    return { isAuthenticated, login: () => setAuthenticated(true), logout: () => setAuthenticated(false) };
}
