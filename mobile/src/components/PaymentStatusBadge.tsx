import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaymentStatus } from '../types/payments.types';

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case PaymentStatus.SUCCEEDED:
                return '#10B981'; // green
            case PaymentStatus.PENDING:
                return '#F59E0B'; // yellow
            case PaymentStatus.FAILED:
                return '#EF4444'; // red
            case PaymentStatus.REFUNDED:
                return '#6B7280'; // gray
            default:
                return '#6B7280';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case PaymentStatus.SUCCEEDED:
                return 'Payé';
            case PaymentStatus.PENDING:
                return 'En attente';
            case PaymentStatus.FAILED:
                return 'Échoué';
            case PaymentStatus.REFUNDED:
                return 'Remboursé';
            default:
                return status;
        }
    };

    return (
        <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.text}>{getStatusText()}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});

