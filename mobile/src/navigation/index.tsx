import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import Icon from '../components/Icon';

// Auth
import LoginScreen            from '../screens/auth/LoginScreen';
import RegisterScreen         from '../screens/auth/RegisterScreen';
import RegisterDriverScreen   from '../screens/auth/RegisterDriverScreen';
import ForgotPasswordScreen   from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen        from '../screens/auth/VerifyOtpScreen';
import ResetPasswordScreen    from '../screens/auth/ResetPasswordScreen';
import VerifyEmailScreen      from '../screens/auth/VerifyEmailScreen';
import MfaScreen              from '../screens/auth/MfaScreen';

// Client
import HomeScreen         from '../screens/client/HomeScreen';
import SearchScreen       from '../screens/client/SearchScreen';
import RestaurantScreen   from '../screens/client/RestaurantScreen';
import ReservationsScreen from '../screens/client/ReservationsScreen';
import OrdersScreen       from '../screens/client/OrdersScreen';
import ProfileScreen      from '../screens/client/ProfileScreen';
import WalletScreen       from '../screens/client/WalletScreen';

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
  const { colors: c } = useTheme();
  const tabOpts = makeTabOptions(c);
  return (
    <Tab.Navigator screenOptions={tabOpts}>
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
  const { colors: c } = useTheme();
  const tabOpts = makeTabOptions(c);
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="driver"  component={DriverScreen}  options={{ title: 'Livraisons', tabBarIcon: ({ focused }) => <TabIcon name="bicycle-outline" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil',     tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Tabs RESTAURANT ───────────────────────────────────────────────────────────

function RestaurantTabs() {
  const { colors: c } = useTheme();
  const tabOpts = makeTabOptions(c);
  return (
    <Tab.Navigator screenOptions={tabOpts}>
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
  const { colors: c } = useTheme();
  const tabOpts = makeTabOptions(c);
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="admin"   component={AdminScreen}   options={{ title: 'Admin',  tabBarIcon: ({ focused }) => <TabIcon name="shield-outline" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Splash animé ─────────────────────────────────────────────────────────────

function SplashScreen() {
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const dot1Scale   = useRef(new Animated.Value(0)).current;
  const dot2Scale   = useRef(new Animated.Value(0)).current;
  const dot3Scale   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo bounce-in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Tagline fade in
      Animated.timing(tagOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      // Loading dots
      Animated.stagger(120, [
        Animated.spring(dot1Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.splash}>
      {/* Logo */}
      <Animated.View style={[styles.splashLogoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.splashIconBg}>
          <Text style={styles.splashIconText}>🍽️</Text>
        </View>
        <Text style={styles.splashName}>Delipose</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.splashTag, { opacity: tagOpacity }]}>
        Kinshasa mange bien
      </Animated.Text>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[dot1Scale, dot2Scale, dot3Scale].map((scale, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ scale }] }]} />
        ))}
      </View>
    </View>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, hasChecked, isLoading } = useAuthStore();

  if (!hasChecked || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyOtp"      component={VerifyOtpScreen} />
            <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
            <Stack.Screen name="VerifyEmail"    component={VerifyEmailScreen} />
            <Stack.Screen name="Mfa"            component={MfaScreen} />
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
            <Stack.Screen name="Wallet"     component={WalletScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeTabOptions(c: typeof colors) {
  return {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: c.surface,
      borderTopColor:  c.border,
      borderTopWidth:  1,
      height: 64,
      paddingBottom: 8,
    },
    tabBarActiveTintColor:   c.accent,
    tabBarInactiveTintColor: c.text3,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
  };
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  splashLogoWrap: { alignItems: 'center', gap: 14 },
  splashIconBg: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: 'rgba(46,196,182,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(46,196,182,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  splashIconText: { fontSize: 40 },
  splashName: {
    fontSize: 36, fontWeight: '900', color: colors.text,
    letterSpacing: -1,
  },
  splashTag: {
    fontSize: 14, color: colors.text3, fontWeight: '500', letterSpacing: 0.3,
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 32 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2EC4B6',
  },
  tabIconWrap: {
    alignItems: 'center', paddingTop: 4,
  },
  tabIndicator: {
    position: 'absolute', top: -4,
    width: 24, height: 2,
    backgroundColor: '#2EC4B6',
    borderRadius: 2,
  },
});
