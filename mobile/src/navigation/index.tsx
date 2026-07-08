import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/auth.store';
import Icon from '../components/Icon';

// Auth
import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';

// Client
import HomeScreen         from '../screens/client/HomeScreen';
import SearchScreen       from '../screens/client/SearchScreen';
import RestaurantScreen   from '../screens/client/RestaurantScreen';
import ReservationsScreen from '../screens/client/ReservationsScreen';
import OrdersScreen       from '../screens/client/OrdersScreen';
import ProfileScreen      from '../screens/client/ProfileScreen';

// Driver
import DriverScreen       from '../screens/driver/DriverScreen';

// Restaurant
import DashboardScreen    from '../screens/restaurant/DashboardScreen';
import MenuScreen         from '../screens/restaurant/MenuScreen';
import OffersScreen       from '../screens/restaurant/OffersScreen';
import ReviewsScreen      from '../screens/restaurant/ReviewsScreen';
import TablesScreen       from '../screens/restaurant/TablesScreen';
import AnalyticsScreen    from '../screens/restaurant/AnalyticsScreen';
import StaffScreen        from '../screens/restaurant/StaffScreen';
import HoursScreen        from '../screens/restaurant/HoursScreen';
import InfosScreen        from '../screens/restaurant/InfosScreen';

// Admin
import AdminScreen        from '../screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Icône tab ─────────────────────────────────────────────────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      {focused && <View style={styles.tabIndicator} />}
      <Icon name={name} size={22} color={focused ? colors.accent : colors.text3} />
    </View>
  );
}

// ── Tabs CLIENT ───────────────────────────────────────────────────────────────

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="home"         component={HomeScreen}         options={{ title: 'Accueil',      tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} /> }} />
      <Tab.Screen name="search"       component={SearchScreen}       options={{ title: 'Recherche',    tabBarIcon: ({ focused }) => <TabIcon name="search-outline" focused={focused} /> }} />
      <Tab.Screen name="reservations" component={ReservationsScreen} options={{ title: 'Réservations', tabBarIcon: ({ focused }) => <TabIcon name="calendar-outline" focused={focused} /> }} />
      <Tab.Screen name="orders"       component={OrdersScreen}       options={{ title: 'Commandes',    tabBarIcon: ({ focused }) => <TabIcon name="bag-outline" focused={focused} /> }} />
      <Tab.Screen name="profile"      component={ProfileScreen}      options={{ title: 'Profil',       tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs LIVREUR ──────────────────────────────────────────────────────────────

function DriverTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="driver"  component={DriverScreen}  options={{ title: 'Livraisons', tabBarIcon: ({ focused }) => <TabIcon name="bicycle-outline" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil',     tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs RESTAURANT ───────────────────────────────────────────────────────────

function RestaurantTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="dashboard"  component={DashboardScreen}  options={{ title: 'Dashboard',    tabBarIcon: ({ focused }) => <TabIcon name="speedometer-outline" focused={focused} /> }} />
      <Tab.Screen name="menu"       component={MenuScreen}       options={{ title: 'Menu',          tabBarIcon: ({ focused }) => <TabIcon name="restaurant-outline" focused={focused} /> }} />
      <Tab.Screen name="offers"     component={OffersScreen}     options={{ title: 'Offres',        tabBarIcon: ({ focused }) => <TabIcon name="pricetag-outline" focused={focused} /> }} />
      <Tab.Screen name="reviews"    component={ReviewsScreen}    options={{ title: 'Avis',          tabBarIcon: ({ focused }) => <TabIcon name="star-outline" focused={focused} /> }} />
      <Tab.Screen name="tables"     component={TablesScreen}     options={{ title: 'Tables',        tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" focused={focused} /> }} />
      <Tab.Screen name="analytics"  component={AnalyticsScreen}  options={{ title: 'Analytics',     tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-outline" focused={focused} /> }} />
      <Tab.Screen name="staff"      component={StaffScreen}      options={{ title: 'Personnel',     tabBarIcon: ({ focused }) => <TabIcon name="people-outline" focused={focused} /> }} />
      <Tab.Screen name="hours"      component={HoursScreen}      options={{ title: 'Horaires',      tabBarIcon: ({ focused }) => <TabIcon name="time-outline" focused={focused} /> }} />
      <Tab.Screen name="infos"      component={InfosScreen}      options={{ title: 'Infos',         tabBarIcon: ({ focused }) => <TabIcon name="information-circle-outline" focused={focused} /> }} />
      <Tab.Screen name="profile"    component={ProfileScreen}    options={{ title: 'Profil',        tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs ADMIN ────────────────────────────────────────────────────────────────

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="admin"   component={AdminScreen}   options={{ title: 'Admin',  tabBarIcon: ({ focused }) => <TabIcon name="shield-outline" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
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
        ) : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
          <Stack.Screen name="AdminTabs"      component={AdminTabs} />
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
  tabIconWrap: {
    alignItems: 'center', paddingTop: 4,
  },
  tabIndicator: {
    position: 'absolute', top: -4,
    width: 24, height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});
