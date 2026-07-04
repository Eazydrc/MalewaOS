import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { usePublicRestaurants, useMe } from '@elengi/shared';
import { Restaurant } from '@elengi/shared';

const CATEGORIES = ['Tous', 'Africain', 'Grillades', 'Pizza', 'Poulet', 'Sushi', 'Fast-food'];

export default function HomeScreen({ navigation }: any) {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('Tous');

  const { data: user } = useMe();
  const { data: restaurants = [], isLoading, refetch } = usePublicRestaurants({
    search,
    category: category === 'Tous' ? undefined : category,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour{user ? `, ${user.firstName}` : ''} 👋</Text>
          <Text style={styles.tagline}>Que voulez-vous manger ?</Text>
        </View>
        {user && (
          <View style={styles.points}>
            <Text style={styles.pointsText}>⭐ {user.points} pts</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher un restaurant…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cats}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cat, category === item && styles.catActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Restaurants */}
      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun restaurant trouvé</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onPress={() => navigation.navigate('Restaurant', { id: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImg}>
        {restaurant.coverUrl ? (
          <Image source={{ uri: restaurant.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 40 }}>🍽️</Text>
          </View>
        )}
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{restaurant.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{restaurant.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{restaurant.category ?? 'Restaurant'} · {restaurant.address ?? 'Kinshasa'}</Text>
        {restaurant.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{restaurant.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  greeting:      { fontSize: 22, fontWeight: '700', color: colors.text },
  tagline:       { fontSize: 14, color: colors.text3, marginTop: 2 },
  points:        { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  pointsText:    { color: colors.accent, fontWeight: '700', fontSize: 13 },
  searchRow:     { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  search:        {
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.text, fontSize: 15,
  },
  cats:          { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  cat:           { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface2 },
  catActive:     { backgroundColor: colors.accent },
  catText:       { color: colors.text3, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: colors.white },
  list:          { padding: spacing.lg, gap: spacing.md, paddingTop: 0 },
  card:          { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  cardImg:       { height: 160, backgroundColor: colors.surface2 },
  cardBadge:     {
    position: 'absolute', bottom: spacing.sm, left: spacing.sm,
    backgroundColor: 'rgba(13,14,30,0.8)', borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  cardBadgeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  cardBody:      { padding: spacing.md },
  cardName:      { fontSize: 17, fontWeight: '700', color: colors.text },
  cardSub:       { fontSize: 13, color: colors.text3, marginTop: 2 },
  cardDesc:      { fontSize: 13, color: colors.text2, marginTop: 6, lineHeight: 18 },
  empty:         { alignItems: 'center', paddingTop: 80 },
  emptyText:     { color: colors.text3, fontSize: 16 },
});
