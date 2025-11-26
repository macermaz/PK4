// Required side-effect import: gesture handler
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Importar contextos
import { AppProvider } from './src/contexts/AppContext';
import { AIProvider } from './src/contexts/AIContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Importar pantallas
import LockScreen from './src/screens/LockScreen';
import DesktopScreen from './src/screens/DesktopScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import ChatScreen from './src/screens/ChatScreen';
import MailScreen from './src/screens/MailScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import DiagnosisScreen from './src/screens/DiagnosisScreen';
import DiagnosticToolScreen from './src/screens/DiagnosticToolScreen';
import PsykTokScreen from './src/screens/PsykTokScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TreatmentScreen from './src/screens/TreatmentScreen';

// Importar tipos de navegación
import { RootStackParamList } from './src/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
// Temporary workaround: some @react-navigation types require an `id` prop
// depending on versions of React/React Native. Use a loosely-typed alias
// for the Navigator to avoid a TypeScript overload mismatch until
// dependencies are aligned (downgrade React or upgrade navigation types).
const StackNavigator: any = Stack.Navigator;

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <AIProvider>
            <NotificationProvider>
            <NavigationContainer>
              <StatusBar 
                style="light" 
                backgroundColor="transparent" 
                translucent 
              />
              <StackNavigator
                initialRouteName="LockScreen"
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: '#000' },
                  cardStyleInterpolator: ({ current, next, layouts }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateX: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [layouts.screen.width, 0],
                            }),
                          },
                        ],
                      },
                      overlayStyle: {
                        opacity: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.5],
                        }),
                      },
                    };
                  },
                }}
              >
                <Stack.Screen name="LockScreen" component={LockScreen} />
                <Stack.Screen name="Desktop" component={DesktopScreen} />
                <Stack.Screen name="Messaging" component={MessagingScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="Mail" component={MailScreen} />
                <Stack.Screen name="Contacts" component={ContactsScreen} />
                <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
                <Stack.Screen name="DiagnosticTool" component={DiagnosticToolScreen} />
                <Stack.Screen name="Treatment" component={TreatmentScreen} />
                <Stack.Screen name="PsykTok" component={PsykTokScreen} />
                <Stack.Screen name="Diary" component={DiaryScreen} />
                <Stack.Screen name="Results" component={ResultsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </StackNavigator>
            </NavigationContainer>
            </NotificationProvider>
          </AIProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}