import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../../theme/colors';
import { useMyRestaurant, useUpdateHours } from '@elengi/shared';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

type DayHours = { open: boolean; openTime: string; closeTime: string };
type Hours = DayHours[];

const DEFAULT_HOURS: Hours = DAYS.map(() => ({ open: true, openTime: '09:00', closeTime: '22:00' }));

export default function HoursScreen() {
  const { data: restaurant } = useMyRestaurant();
  const updateHours = useUpdateHours();
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (restaurant?.hours) setHours(restaurant.hours);
  }, [restaurant]);

  const toggle = (i: number) =>
    setHours((h) => h.map((d, idx) => idx === i ? { ...d, open: !d.open } : d));

  const setTime = (i: number, key: 'openTime' | 'closeTime', val: string) =>
    setHours((h) => h.map((d, idx) => idx === i ? { ...d, [key]: val } : d));

  const handleSave = () => {
    updateHours.mutate(hours, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Horaires</Text>
        <TouchableOpacity style={[s.saveBtn, saved && s.savedBtn]} onPress={handleSave}>
          <Text style={s.saveBtnText}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        {DAYS.map((day, i) => (
          <View key={day} style={s.card}>
            <View style={s.dayRow}>
              <Text style={s.dayName}>{day}</Text>
              <Switch
                value={hours[i]?.open ?? true}
                onValueChange={() => toggle(i)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>
            {hours[i]?.open && (
              <View style={s.timeRow}>
                <View style={s.timeGroup}>
                  <Text style={s.timeLabel}>Ouverture</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {TIMES.slice(0, 32).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[s.timeChip, hours[i]?.openTime === t && s.timeChipActive]}
                          onPress={() => setTime(i, 'openTime', t)}
                        >
                          <Text style={[s.timeChipText, hours[i]?.openTime === t && s.timeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={s.timeGroup}>
                  <Text style={s.timeLabel}>Fermeture</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {TIMES.slice(16).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[s.timeChip, hours[i]?.closeTime === t && s.timeChipActive]}
                          onPress={() => setTime(i, 'closeTime', t)}
                        >
                          <Text style={[s.timeChipText, hours[i]?.closeTime === t && s.timeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}
            {!hours[i]?.open && <Text style={s.closedText}>Fermé ce jour</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  title:            { fontSize: 22, fontWeight: '800', color: colors.text },
  saveBtn:          { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  savedBtn:         { backgroundColor: colors.success },
  saveBtnText:      { color: colors.white, fontWeight: '700' },
  card:             { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  dayRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName:          { fontSize: 16, fontWeight: '700', color: colors.text },
  timeRow:          { marginTop: spacing.sm, gap: 8 },
  timeGroup:        { gap: 6 },
  timeLabel:        { fontSize: 12, color: colors.text3 },
  timeChip:         { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  timeChipActive:   { backgroundColor: colors.accent, borderColor: colors.accent },
  timeChipText:     { fontSize: 12, color: colors.text3 },
  timeChipTextActive: { color: colors.white, fontWeight: '700' },
  closedText:       { marginTop: 8, fontSize: 13, color: colors.danger },
});
