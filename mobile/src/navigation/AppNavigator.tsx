import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { KycWebViewScreen } from '../screens/KycWebViewScreen';

export type RootStackParamList = {
    Profile: undefined;
    KycWebView: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
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
                    options={{ title: 'Vérification d\'identité' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
