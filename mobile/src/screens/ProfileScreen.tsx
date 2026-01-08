import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useKyc } from '../hooks/useKyc';
import { KycStatusBadge } from '../components/KycStatusBadge';
import { KycStatus } from '../types/kyc.types';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
    Profile: undefined;
    KycWebView: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const { user, logout } = useAuth();

    const { kycStatus, isLoadingStatus, refetch } = useKyc();


    const handleVerifyIdentity = () => {
        navigation.navigate('KycWebView');
    };

    const shouldShowVerifyButton =
        kycStatus?.status === KycStatus.NONE ||
        kycStatus?.status === KycStatus.REJECTED;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={isLoadingStatus} onRefresh={refetch} />
            }
        >
            <View style={styles.content}>
                <Text style={styles.title}>Mon Profil</Text>

                {/* User Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{user?.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Rôle:</Text>
                        <Text style={styles.value}>{user?.role}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#EF4444' }]}
                        onPress={logout}
                    >
                        <Text style={styles.buttonText}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>

                {/* KYC Status Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vérification d'identité (KYC)</Text>

                    {isLoadingStatus ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                        <>
                            <View style={styles.statusRow}>
                                <Text style={styles.label}>Statut:</Text>
                                {kycStatus && <KycStatusBadge status={kycStatus.status} />}
                            </View>

                            {kycStatus?.applicantId && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>ID Applicant:</Text>
                                    <Text style={styles.valueSmall}>{kycStatus.applicantId}</Text>
                                </View>
                            )}

                            {shouldShowVerifyButton && (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleVerifyIdentity}
                                >
                                    <Text style={styles.buttonText}>Vérifier mon identité</Text>
                                </TouchableOpacity>
                            )}

                            {kycStatus?.status === KycStatus.PENDING && (
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoText}>
                                        Votre vérification d'identité est en cours de traitement.
                                    </Text>
                                </View>
                            )}

                            {kycStatus?.status === KycStatus.APPROVED && (
                                <View style={styles.successBox}>
                                    <Text style={styles.successText}>
                                        ✓ Votre identité a été vérifiée avec succès !
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 24,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
    },
    value: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    valueSmall: {
        fontSize: 12,
        color: '#111827',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    infoText: {
        color: '#92400E',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    successText: {
        color: '#065F46',
        fontSize: 14,
        fontWeight: '500',
    },
});
