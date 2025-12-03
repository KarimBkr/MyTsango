import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

// Création d'un Stack Navigator (navigation empilée)
const Stack = createNativeStackNavigator();

// Écrans de base (HomeScreen et ProfileScreen par exemple)
function HomeScreen() {
    return (
        <View>
            <Text>Home Screen</Text>
        </View>
    );
}

function ProfileScreen() {
    return (
        <View>
            <Text>Profile Screen</Text>
        </View>
    );
}

export default function RootNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
}
