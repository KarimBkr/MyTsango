import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { KycWebViewScreen } from '../screens/KycWebViewScreen';

export type RootStackParamList = {
    Login: undefined;
    Profile: undefined;
    KycWebView: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator
                    initialRouteName="Profile"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#3B82F6',
                        },
                        headerTintColor: '#FFFFFF',
                    }}
                >
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{ title: 'Mon Profil' }}
                    />
                    <Stack.Screen
                        name="KycWebView"
                        component={KycWebViewScreen}
                        options={{ title: "Vérification d'identité" }}
                    />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
};
