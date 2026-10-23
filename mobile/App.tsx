import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AskScreen from './src/screens/AskScreen';
import ResultScreen from './src/screens/ResultScreen';
import DirectoryScreen from './src/screens/DirectoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AboutScreen from './src/screens/AboutScreen';
import { APP_NAME, COLORS } from './src/config';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '800' },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: APP_NAME }} />
            <Stack.Screen name="Ask" component={AskScreen} options={{ title: 'Ask the team' }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result' }} />
            <Stack.Screen name="Directory" component={DirectoryScreen} options={{ title: 'Member directory' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About and evidence' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
