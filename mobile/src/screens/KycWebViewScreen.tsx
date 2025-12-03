import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useKyc } from '../hooks/useKyc';

export const KycWebViewScreen: React.FC = () => {
    const navigation = useNavigation();
    const userId = 'test-user-123'; // Phase 1: Hardcoded
    const { startKycAsync, isStarting } = useKyc(userId);

    const [sdkToken, setSdkToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initializeKyc();
    }, []);

    const initializeKyc = async () => {
        try {
            const result = await startKycAsync();
            setSdkToken(result.token);
            console.log('KYC initialized with token:', result.token);
        } catch (err) {
            console.error('Failed to initialize KYC:', err);
            setError('Impossible de démarrer la vérification. Veuillez réessayer.');
        }
    };

    const handleRetry = () => {
        setError(null);
        setSdkToken(null);
        initializeKyc();
    };

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('WebView message:', data);

            if (data.type === 'success' || data.type === 'completed') {
                Alert.alert(
                    'Vérification terminée',
                    'Votre vérification d\'identité a été soumise avec succès.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            }
        } catch (err) {
            console.error('Failed to parse WebView message:', err);
        }
    };

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isStarting || !sdkToken) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Initialisation de la vérification...</Text>
            </View>
        );
    }

    // Phase 1: Display mock WebView content
    // Phase 2: Load real Sumsub WebSDK
    const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #F9FAFB;
            margin: 0;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 {
            color: #111827;
            font-size: 24px;
            margin-bottom: 16px;
          }
          p {
            color: #6B7280;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .token {
            background: #F3F4F6;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 16px 0;
          }
          .button {
            background: #3B82F6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
          }
          .info {
            background: #DBEAFE;
            padding: 12px;
            border-radius: 8px;
            color: #1E40AF;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Vérification d'identité (MOCK)</h1>
          <p>Ceci est une interface de test pour la Phase 1.</p>
          <p>En Phase 2, cette page chargera le vrai SDK Sumsub pour la vérification d'identité.</p>
          
          <div class="info">
            <strong>Phase 1 - Mode Test</strong><br>
            Token SDK reçu avec succès
          </div>
          
          <div class="token">
            Token: ${sdkToken}
          </div>
          
          <button class="button" onclick="completeVerification()">
            Simuler vérification réussie
          </button>
        </div>
        
        <script>
          function completeVerification() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              message: 'Verification completed'
            }));
          }
        </script>
      </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: mockHtml }}
                onMessage={handleWebViewMessage}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB',
    },
    webview: {
        flex: 1,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorText: {
        fontSize: 16,
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginBottom: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
    },
});
