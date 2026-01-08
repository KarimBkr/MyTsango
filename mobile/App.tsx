import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NotificationsInitializer } from './src/components/NotificationsInitializer';

const queryClient = new QueryClient();

// ⚠️ TODO: Récupérer depuis les variables d'environnement
// Pour l'instant, utiliser une clé publique Stripe de test
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationsInitializer />
          <AppNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}
