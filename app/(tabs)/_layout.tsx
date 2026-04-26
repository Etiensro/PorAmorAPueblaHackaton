import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import Login from './Login';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Muestra la pantalla de Login si no está autenticado
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <Login onLoginSuccess={(user) => setIsAuthenticated(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <Tabs
      initialRouteName="Inicio"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="Inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Lugares',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet" 
        options={{
          title: 'Billetera',
          tabBarIcon: ({ color }) => <Ionicons name="card-outline" size={28} color={color} />
        }}
      />
      <Tabs.Screen
          name="recompensas"
          options={{
            title: 'Premios',
            tabBarIcon: ({ color }) => <Ionicons name="leaf" size={28} color={color} />,
          }}
      />
      
      {/* Ocultamos explícitamente la pantalla de login desde la configuración si existe */}
      <Tabs.Screen
        name="Login"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="INE/INEVerification"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
