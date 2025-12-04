import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useKyc } from '../hooks/useKyc';
import { useAuth } from '../contexts/AuthContext';

export const KycWebViewScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { startKycAsync, isStarting } = useKyc();

    const [sdkToken, setSdkToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initializeKyc();
    }, []);

    const initializeKyc = async () => {
        try {
            const result = await startKycAsync();
            setSdkToken(result.sdkAccessToken);
            console.log('KYC initialized with token:', result.sdkAccessToken);
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

    // Load real Sumsub WebSDK
    const sumsubHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.sumsub.com/idensic/latest/idensic.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #sumsub-websdk-container {
            width: 100%;
            height: 100vh;
          }
        </style>
      </head>
      <body>
        <div id="sumsub-websdk-container"></div>
        <script>
          (function() {
            try {
              const snsWebSdkInstance = snsWebSdk.init('${sdkToken}')
                .on('idCheck.onStepCompleted', function(payload) {
                  console.log('Step completed:', payload);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'stepCompleted',
                    payload: payload
                  }));
                })
                .on('idCheck.onApplicantSubmitted', function(payload) {
                  console.log('Applicant submitted:', payload);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'success',
                    message: 'Verification submitted',
                    payload: payload
                  }));
                })
                .on('idCheck.onError', function(error) {
                  console.error('Sumsub error:', error);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: error.message || 'An error occurred',
                    error: error
                  }));
                })
                .on('idCheck.onViewerReady', function(viewer) {
                  console.log('Viewer ready:', viewer);
                })
                .build();
            } catch (error) {
              console.error('Failed to initialize Sumsub SDK:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'Failed to initialize verification: ' + error.message
              }));
            }
          })();
        </script>
      </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: sumsubHtml }}
                onMessage={handleWebViewMessage}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
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
