import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/auth.store';

// Screens
import LoginScreen       from '../screens/auth/LoginScreen';
import RegisterScreen    from '../screens/auth/RegisterScreen';
import HomeScreen        from '../screens/client/HomeScreen';
import SearchScreen      from '../screens/client/SearchScreen';
import RestaurantScreen  from '../screens/client/RestaurantScreen';
import ReservationsScreen from '../screens/client/ReservationsScreen';
import OrdersScreen      from '../screens/client/OrdersScreen';
import ProfileScreen     from '../screens/client/ProfileScreen';
import DriverScreen      from '../screens/driver/DriverScreen';
import RestaurantDashScreen from '../screens/restaurant/DashboardScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Icône tab simple ──────────────────────────────────────────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠', search: '🔍', reservations: '📅', orders: '🛍️', profile: '👤',
    driver: '🛵', dashboard: '📊',
  };
  return (
    <View style={styles.tabIcon}>
      {focused && <View style={styles.tabIndicator} />}
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[name] ?? '•'}</Text>
    </View>
  );
}

// ── Tabs CLIENT ───────────────────────────────────────────────────────────────

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="home"         component={HomeScreen}         options={{ title: 'Accueil',      tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tab.Screen name="search"       component={SearchScreen}       options={{ title: 'Recherche',    tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }} />
      <Tab.Screen name="reservations" component={ReservationsScreen} options={{ title: 'Réservations', tabBarIcon: ({ focused }) => <TabIcon name="reservations" focused={focused} /> }} />
      <Tab.Screen name="orders"       component={OrdersScreen}       options={{ title: 'Commandes',    tabBarIcon: ({ focused }) => <TabIcon name="orders" focused={focused} /> }} />
      <Tab.Screen name="profile"      component={ProfileScreen}      options={{ title: 'Profil',       tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs LIVREUR ──────────────────────────────────────────────────────────────

function DriverTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="driver"  component={DriverScreen}  options={{ title: 'Livraisons', tabBarIcon: ({ focused }) => <TabIcon name="driver" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil',     tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs RESTAURANT ───────────────────────────────────────────────────────────

function RestaurantTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="dashboard" component={RestaurantDashScreen} options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} /> }} />
      <Tab.Screen name="profile"   component={ProfileScreen}        options={{ title: 'Profil',    tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, hasChecked, isLoading } = useAuthStore();

  if (!hasChecked || isLoading) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: colors.accent, fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Elengi</Text>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'LIVREUR' ? (
          <Stack.Screen name="DriverTabs"     component={DriverTabs} />
        ) : user.role === 'RESTAURANT' ? (
          <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
        ) : (
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const tabOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor:  colors.border,
    borderTopWidth:  1,
    height: 64,
    paddingBottom: 8,
  },
  tabBarActiveTintColor:   colors.accent,
  tabBarInactiveTintColor: colors.text3,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
};

const styles = StyleSheet.create({
  loader: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  tabIcon: {
    alignItems: 'center', paddingTop: 4,
  },
  tabIndicator: {
    position: 'absolute', top: -4,
    width: 24, height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});
