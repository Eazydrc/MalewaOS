import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMyRestaurant, useUpdateMyRestaurant } from '@elengi/shared';

const CATEGORIES = ['Africain', 'Congolais', 'Européen', 'Fast-food', 'Pizza', 'Grillades', 'Sushi', 'Végétarien', 'Libanais'];
const PRICE_RANGES = [1, 2, 3, 4];

export default function InfosScreen() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const updateResto = useUpdateMyRestaurant();

  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [address, setAddress]   = useState('');
  const [phone, setPhone]       = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState(2);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name ?? '');
      setDesc(restaurant.description ?? '');
      setAddress(restaurant.address ?? '');
      setPhone(restaurant.phone ?? '');
      setCategory(restaurant.category ?? '');
      setPriceRange(restaurant.priceRange ?? 2);
    }
  }, [restaurant]);

  const handleSave = () => {
    updateResto.mutate(
      { name, description: desc, address, phone, category, priceRange },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Informations</Text>
        <TouchableOpacity style={[s.saveBtn, saved && s.savedBtn]} onPress={handleSave}>
          <Text style={s.saveBtnText}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Informations générales</Text>
          {[
            { label: 'Nom du restaurant *', val: name, set: setName, placeholder: 'Chez Mama Kimia' },
            { label: 'Adresse', val: address, set: setAddress, placeholder: 'Avenue de la Paix, Kinshasa' },
            { label: 'Téléphone', val: phone, set: setPhone, placeholder: '+243 81 234 5678', numeric: true },
          ].map(({ label, val, set, placeholder, numeric }) => (
            <View key={label} style={{ marginBottom: 12 }}>
              <Text style={s.label}>{label}</Text>
              <TextInput
                style={s.input} value={val} onChangeText={set}
                placeholder={placeholder} placeholderTextColor={colors.text3}
                keyboardType={numeric ? 'phone-pad' : 'default'}
              />
            </View>
          ))}

          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={desc} onChangeText={setDesc}
            placeholder="Décrivez votre restaurant..." placeholderTextColor={colors.text3}
            multiline
          />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Catégorie</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.chip, category === c && s.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Gamme de prix</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 8 }}>
            {PRICE_RANGES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.priceBtn, priceRange === p && s.priceBtnActive]}
                onPress={() => setPriceRange(p)}
              >
                <Text style={[s.priceBtnText, priceRange === p && s.priceBtnTextActive]}>
                  {'$'.repeat(p)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:           { fontSize: 22, fontWeight: '800', color: colors.text },
  saveBtn:         { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  savedBtn:        { backgroundColor: colors.success },
  saveBtnText:     { color: colors.white, fontWeight: '700' },
  card:            { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  cardTitle:       { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  label:           { fontSize: 13, color: colors.text2, marginBottom: 4 },
  input:           { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 0 },
  chip:            { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive:      { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText:        { fontSize: 13, color: colors.text3 },
  chipTextActive:  { color: colors.white, fontWeight: '600' },
  priceBtn:        { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  priceBtnActive:  { backgroundColor: colors.accent, borderColor: colors.accent },
  priceBtnText:    { fontSize: 16, color: colors.text3, fontWeight: '700' },
  priceBtnTextActive: { color: colors.white },
});
