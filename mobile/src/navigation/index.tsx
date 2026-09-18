import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
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
  const { bottom } = useSafeAreaInsets();
  const tabOpts = makeTabOptions(c, bottom);
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
  const { bottom } = useSafeAreaInsets();
  const tabOpts = makeTabOptions(c, bottom);
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
  const { bottom } = useSafeAreaInsets();
  const tabOpts = makeTabOptions(c, bottom);
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
  const { bottom } = useSafeAreaInsets();
  const tabOpts = makeTabOptions(c, bottom);
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="admin"   component={AdminScreen}   options={{ title: 'Admin',  tabBarIcon: ({ focused }) => <TabIcon name="shield-outline" focused={focused} /> }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── SVG du vrai logo Delipose ─────────────────────────────────────────────────

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 149.91 149.91">
  <rect fill="#5bb8aa" width="149.91" height="149.91" rx="47.44" ry="47.44"/>
  <path fill="#fff" d="m58.23,36.3c-5.05,2.15-9.43,5.2-13.14,9.15-3.71,3.95-6.57,8.57-8.57,13.85-2,5.28-2.99,11.05-2.99,17.31v33.21h82.86v-33.45c0-6.18-1.02-11.91-3.05-17.19-2.03-5.28-4.89-9.88-8.57-13.79-3.68-3.91-8.06-6.94-13.14-9.1-5.09-2.15-10.64-3.23-16.67-3.23s-11.68,1.08-16.72,3.23Zm30.22,18.72c3.84,2.03,6.75,4.93,8.74,8.68,1.99,3.76,2.99,8.14,2.99,13.15v14.55h-50.58v-14.55c0-5.01,1.02-9.37,3.05-13.09,2.03-3.71,4.93-6.61,8.68-8.69,3.76-2.07,8.25-3.11,13.5-3.11s9.78,1.02,13.61,3.05Z"/>
  <circle fill="#fff" cx="74.9" cy="33.07" r="11.53"/>
  <circle fill="#fff" cx="55.73" cy="109.39" r="11.53"/>
  <circle fill="#fff" cx="94.76" cy="109.39" r="11.53"/>
</svg>`;

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 517.87 113.16">
  <path fill="#5bb8aa" d="m81.11,27.16c-4.19-4.45-9.17-7.9-14.97-10.36-1.95-.82-3.96-1.5-6.02-2.04.07-.54.11-1.08.11-1.63,0-7.25-5.88-13.13-13.13-13.13s-13.13,5.88-13.13,13.13c0,.56.05,1.1.11,1.64-2.05.54-4.04,1.21-5.96,2.03-5.75,2.45-10.73,5.93-14.97,10.42-4.23,4.5-7.48,9.75-9.75,15.77-2.27,6.01-3.41,12.58-3.41,19.71v37.82h12.17c.26,7.02,6.02,12.63,13.11,12.63s12.84-5.61,13.11-12.63h18.23c.26,7.02,6.02,12.63,13.11,12.63s12.84-5.61,13.11-12.63h11.51v-38.09c0-7.04-1.16-13.56-3.47-19.58-2.32-6.01-5.57-11.24-9.76-15.7Zm-5.21,52.38H18.31v-16.57c0-5.7,1.16-10.67,3.48-14.9,2.32-4.23,5.61-7.53,9.89-9.89,4.28-2.36,9.4-3.54,15.37-3.54s11.14,1.16,15.5,3.47c4.37,2.32,7.68,5.61,9.96,9.89,2.27,4.28,3.41,9.27,3.41,14.97v16.57Z"/>
  <path fill="#5bb8aa" d="m154.32,66.93c.19,2.96-.24,5.75-1.28,8.36-1.04,2.62-2.69,5.05-4.96,7.32-2.46,2.46-5.1,4.06-7.94,4.82-2.84.76-5.7.66-8.6-.28-.96-.31-1.9-.76-2.84-1.26l32.79-32.95c-.95-1.45-1.83-2.68-2.65-3.69-.82-1.01-1.64-1.92-2.46-2.74-4.47-4.47-9.43-7.45-14.88-8.93-5.45-1.48-10.88-1.46-16.3.05-5.42,1.51-10.39,4.53-14.93,9.07s-7.81,9.89-9.45,15.69c-1.64,5.8-1.73,11.59-.29,17.39,1.45,5.8,4.47,10.99,9.07,15.59,4.6,4.6,9.83,7.62,15.69,9.07,5.86,1.45,11.75,1.26,17.67-.57,5.92-1.83,11.37-5.23,16.35-10.2,3.84-3.84,6.71-8.03,8.6-12.57,1.89-4.54,2.65-9.26,2.27-14.18h-15.87Zm-35.54,9.04c-.46-.85-.87-1.71-1.17-2.57-.98-2.8-1.15-5.56-.52-8.27.63-2.71,2.08-5.2,4.35-7.46,2.14-2.14,4.41-3.5,6.8-4.06,2.39-.57,4.84-.36,7.32.62,1.04.41,2.1.99,3.18,1.68l-19.96,20.07Z"/>
  <rect fill="#5bb8aa" x="175.66" y="6.92" width="20.45" height="97.01"/>
  <rect fill="#5bb8aa" x="199.97" y="38.99" width="20.44" height="64.95"/>
  <path fill="#5bb8aa" d="m212.21,7.59c-3.21,0-5.86,1.07-7.95,3.21-2.1,2.14-3.14,4.81-3.14,8.02s1.05,5.77,3.14,7.95c2.09,2.19,4.75,3.28,7.95,3.28s5.83-1.09,7.89-3.28c2.05-2.18,3.07-4.83,3.07-7.95s-1.02-5.88-3.07-8.02c-2.05-2.14-4.68-3.21-7.89-3.21Z"/>
  <path fill="#5bb8aa" d="m283.77,13.2c-4.81-2.41-10.2-3.61-16.17-3.61h-39.42v94.34h20.98v-34.34h18.44c5.97,0,11.36-1.22,16.17-3.67,4.81-2.45,8.62-5.92,11.42-10.42,2.81-4.5,4.21-9.82,4.21-15.97s-1.4-11.47-4.21-15.97c-2.81-4.5-6.61-7.95-11.42-10.36Zm-7.08,33.81c-1.25,2.05-2.94,3.61-5.08,4.68-2.14,1.07-4.5,1.6-7.08,1.6h-15.37v-27.39h15.37c2.58,0,4.95.53,7.08,1.6,2.14,1.07,3.83,2.63,5.08,4.68,1.25,2.05,1.87,4.5,1.87,7.35s-.63,5.43-1.87,7.48Z"/>
  <path fill="#5bb8aa" d="m349.53,42c-5.34-2.94-11.4-4.41-18.17-4.41s-12.83,1.49-18.17,4.48c-5.35,2.99-9.58,7.02-12.7,12.09-3.12,5.08-4.68,10.82-4.68,17.24s1.56,12.21,4.68,17.37c3.12,5.17,7.37,9.24,12.76,12.23,5.39,2.99,11.43,4.48,18.11,4.48s12.83-1.49,18.17-4.48c5.34-2.98,9.58-7.06,12.7-12.23,3.12-5.17,4.68-10.96,4.68-17.37s-1.56-12.18-4.68-17.31c-3.12-5.12-7.35-9.15-12.7-12.09Zm-5.28,37.48c-1.2,2.36-2.92,4.19-5.14,5.48-2.23,1.29-4.81,1.94-7.75,1.94s-5.39-.64-7.61-1.94c-2.23-1.29-3.97-3.12-5.21-5.48-1.25-2.36-1.87-5.01-1.87-7.95s.62-5.7,1.87-8.02c1.25-2.31,2.98-4.12,5.21-5.41,2.23-1.29,4.76-1.94,7.61-1.94s5.5.65,7.68,1.94c2.18,1.29,3.9,3.07,5.14,5.34,1.25,2.27,1.87,4.92,1.87,7.95s-.6,5.73-1.8,8.08Z"/>
  <path fill="#5bb8aa" d="m393.23,54.76c1.16-.67,2.9-1,5.21-1s4.88.49,7.42,1.47c2.54.98,4.83,2.67,6.88,5.08l11.63-11.76c-2.94-3.74-6.75-6.57-11.42-8.49-4.68-1.92-9.78-2.87-15.3-2.87s-9.85.89-13.76,2.67c-3.92,1.78-6.95,4.21-9.09,7.28-2.14,3.07-3.21,6.7-3.21,10.89,0,3.92.76,7.15,2.27,9.69,1.51,2.54,3.47,4.52,5.88,5.95,2.41,1.43,4.94,2.54,7.62,3.34,2.67.8,5.21,1.54,7.62,2.2,2.41.67,4.39,1.43,5.95,2.27,1.56.85,2.34,2.07,2.34,3.67,0,1.25-.65,2.23-1.94,2.94-1.29.71-3.14,1.07-5.55,1.07-3.47,0-6.68-.65-9.62-1.94-2.94-1.29-5.48-3.09-7.62-5.41l-11.63,11.76c2.23,2.41,4.92,4.52,8.09,6.35,3.16,1.83,6.59,3.23,10.29,4.21,3.7.98,7.46,1.47,11.29,1.47,8.1,0,14.54-1.87,19.31-5.61,4.76-3.74,7.15-8.77,7.15-15.1,0-4.1-.76-7.42-2.27-9.95-1.51-2.54-3.47-4.57-5.88-6.08-2.41-1.51-4.94-2.72-7.62-3.61-2.67-.89-5.21-1.65-7.62-2.27-2.41-.62-4.37-1.34-5.88-2.14-1.52-.8-2.27-1.87-2.27-3.21,0-1.25.58-2.2,1.74-2.87Z"/>
  <path fill="#5bb8aa" d="m480.92,66.99c.19,2.96-.24,5.75-1.28,8.36-1.04,2.62-2.69,5.05-4.96,7.32-2.46,2.46-5.1,4.06-7.94,4.82-2.83.76-5.7.66-8.6-.28-.96-.31-1.9-.76-2.84-1.26l32.79-32.95c-.95-1.45-1.83-2.68-2.65-3.69-.82-1.01-1.64-1.92-2.46-2.74-4.47-4.47-9.43-7.45-14.88-8.93-5.45-1.48-10.88-1.46-16.3.05-5.42,1.51-10.39,4.53-14.93,9.07s-7.81,9.89-9.45,15.69c-1.64,5.8-1.73,11.59-.29,17.39,1.45,5.8,4.47,10.99,9.07,15.59,4.6,4.6,9.83,7.62,15.69,9.07,5.86,1.45,11.75,1.26,17.67-.57,5.92-1.83,11.37-5.23,16.35-10.2,3.84-3.84,6.71-8.03,8.6-12.57,1.89-4.53,2.64-9.26,2.27-14.17h-15.87Zm-35.54,9.04c-.46-.85-.87-1.71-1.17-2.57-.98-2.8-1.15-5.56-.52-8.27.63-2.71,2.08-5.2,4.35-7.46,2.14-2.14,4.41-3.5,6.8-4.06,2.39-.57,4.84-.36,7.32.61,1.04.41,2.1.99,3.18,1.68l-19.96,20.07Z"/>
  <circle fill="#5bb8aa" cx="507.38" cy="96.05" r="10.49"/>
</svg>`;

// ── Splash animé ─────────────────────────────────────────────────────────────

function SplashScreen() {
  const iconScale   = useRef(new Animated.Value(0.5)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const dot1Scale   = useRef(new Animated.Value(0)).current;
  const dot2Scale   = useRef(new Animated.Value(0)).current;
  const dot3Scale   = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Icône bounce-in
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      // Logo texte fade-in
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Tagline
      Animated.timing(tagOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      // Dots apparaissent
      Animated.stagger(100, [
        Animated.spring(dot1Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.spring(dot2Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.spring(dot3Scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Pulse continu sur l'icône pendant le chargement
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.splash}>
      {/* Icône D animée */}
      <Animated.View style={{
        opacity: iconOpacity,
        transform: [{ scale: Animated.multiply(iconScale, pulseAnim) }],
        marginBottom: 28,
      }}>
        <SvgXml xml={ICON_SVG} width={110} height={110} />
      </Animated.View>

      {/* Logo texte complet */}
      <Animated.View style={{ opacity: logoOpacity, marginBottom: 10 }}>
        <SvgXml xml={LOGO_SVG} width={260} height={58} />
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

function makeTabOptions(c: typeof colors, bottomInset: number) {
  return {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: c.surface,
      borderTopColor:  c.border,
      borderTopWidth:  1,
      height: 64 + bottomInset,
      paddingBottom: 8 + bottomInset,
    },
    tabBarActiveTintColor:   c.accent,
    tabBarInactiveTintColor: c.text3,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
  };
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  splashTag: {
    fontSize: 12, color: colors.text3, fontWeight: '600',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
  },
  dotsRow: { flexDirection: 'row', gap: 7, marginTop: 36 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#5bb8aa',
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
