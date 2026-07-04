import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { usePublicRestaurants } from '@elengi/shared';
import { Restaurant } from '@elengi/shared';

export default function SearchScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const { data: results = [], isLoading } = usePublicRestaurants({ search });

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Recherche</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Nom du restaurant, cuisine…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: Restaurant }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Restaurant', { id: item.id })}
          >
            <View style={styles.imgBox}>
              {item.logoUrl
                ? <Image source={{ uri: item.logoUrl }} style={styles.img} />
                : <Text style={{ fontSize: 28 }}>🍽️</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.category ?? 'Restaurant'} · {item.address ?? 'Kinshasa'}</Text>
            </View>
            <Text style={{ color: item.isOpen ? colors.success : colors.danger, fontSize: 11 }}>
              {item.isOpen ? 'Ouvert' : 'Fermé'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          search.length > 0 && !isLoading
            ? <Text style={styles.empty}>Aucun résultat pour « {search} »</Text>
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  title:     { fontSize: 24, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  input:     {
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.text, fontSize: 15,
  },
  list:      { padding: spacing.lg, gap: spacing.sm, paddingTop: 0 },
  row:       {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.card,
  },
  imgBox:    {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.surface2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  img:       { width: 52, height: 52 },
  name:      { fontSize: 15, fontWeight: '700', color: colors.text },
  sub:       { fontSize: 12, color: colors.text3, marginTop: 2 },
  empty:     { textAlign: 'center', color: colors.text3, marginTop: 40, fontSize: 14 },
});
