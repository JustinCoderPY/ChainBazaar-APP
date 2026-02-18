import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.success,
        tabBarInactiveTintColor: Colors.lightGray,
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: '#333',
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏪</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create Listing',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}