import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  // Le NavigationContainer gère la navigation de l'application
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
