import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// ─── Icon Mapping ────────────────────────────────────────────
//
// Tab name      Active icon              Inactive icon
// ──────────    ────────────────         ────────────────
// Explore       compass                  compass-outline
// Sell          add-circle               add-circle-outline
// Messages      chatbubbles              chatbubbles-outline
// Profile       person-circle            person-circle-outline

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  index:    { active: 'compass',         inactive: 'compass-outline' },
  create:   { active: 'add-circle',      inactive: 'add-circle-outline' },
  messages: { active: 'chatbubbles',     inactive: 'chatbubbles-outline' },
  profile:  { active: 'person-circle',   inactive: 'person-circle-outline' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Sell',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          href: null,
        }}
      />
      {/* Hide the old explore tab from the Expo template */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,    // Hides from tab bar without deleting the file
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    elevation: 0,           // Remove Android shadow
    shadowOpacity: 0,       // Remove iOS shadow
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
