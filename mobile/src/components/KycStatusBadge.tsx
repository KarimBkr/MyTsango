import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KycStatus } from '../types/kyc.types';

interface KycStatusBadgeProps {
    status: KycStatus;
}

export const KycStatusBadge: React.FC<KycStatusBadgeProps> = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case KycStatus.NONE:
                return { label: 'Non vérifié', color: '#6B7280', bgColor: '#F3F4F6' };
            case KycStatus.PENDING:
                return { label: 'En cours', color: '#D97706', bgColor: '#FEF3C7' };
            case KycStatus.APPROVED:
                return { label: 'Vérifié', color: '#059669', bgColor: '#D1FAE5' };
            case KycStatus.REJECTED:
                return { label: 'Rejeté', color: '#DC2626', bgColor: '#FEE2E2' };
            default:
                return { label: 'Inconnu', color: '#6B7280', bgColor: '#F3F4F6' };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
});
