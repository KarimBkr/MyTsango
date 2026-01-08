import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { usePayments } from '../hooks/usePayments';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { PaymentStatus } from '../types/payments.types';

type RootStackParamList = {
    Payment: { circleId: string; amount?: number };
    CircleDetail: { circleId: string };
};

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC = () => {
    const navigation = useNavigation<PaymentScreenNavigationProp>();
    const route = useRoute<PaymentScreenRouteProp>();
    const { circleId, amount: initialAmount = 50 } = route.params;

    const { createPaymentAsync, isCreating } = usePayments(circleId);
    const { confirmPayment } = useStripe();

    const [amount, setAmount] = useState(initialAmount);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Initialiser le paiement au chargement de l'écran
        initializePayment();
    }, []);

    const initializePayment = async () => {
        try {
            const result = await createPaymentAsync({ amount });
            setClientSecret(result.clientSecret);
            setPaymentId(result.paymentId);
        } catch (error: any) {
            console.error('Failed to initialize payment:', error);
            Alert.alert(
                'Erreur',
                'Impossible d\'initialiser le paiement. Veuillez réessayer.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    };

    const handlePayment = async () => {
        if (!clientSecret) {
            Alert.alert('Erreur', 'Paiement non initialisé');
            return;
        }

        setIsProcessing(true);

        try {
            const { error, paymentIntent } = await confirmPayment(clientSecret, {
                paymentMethodType: 'Card',
            });

            if (error) {
                Alert.alert('Paiement échoué', error.message);
            } else if (paymentIntent && paymentIntent.status === 'Succeeded') {
                Alert.alert(
                    'Paiement réussi',
                    'Votre paiement a été traité avec succès.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // TODO: Naviguer vers CircleDetail après que Jihad ait créé l'écran
                                // navigation.navigate('CircleDetail', { circleId });
                                navigation.goBack();
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors du paiement.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isCreating || !clientSecret) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Initialisation du paiement...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Payer ma cotisation</Text>

            <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Montant</Text>
                <Text style={styles.amountValue}>{amount}€</Text>
            </View>

            <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Informations de carte</Text>
                <CardField
                    postalCodeEnabled={false}
                    placeholders={{
                        number: '4242 4242 4242 4242',
                    }}
                    cardStyle={{
                        backgroundColor: '#FFFFFF',
                        textColor: '#000000',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                    }}
                    style={styles.cardField}
                />
            </View>

            <TouchableOpacity
                style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.payButtonText}>Payer {amount}€</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={isProcessing}
            >
                <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 24,
    },
    amountSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
    },
    cardSection: {
        marginBottom: 24,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    cardField: {
        width: '100%',
        height: 50,
        marginVertical: 30,
    },
    payButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
});

