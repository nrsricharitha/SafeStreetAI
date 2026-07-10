"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { useLocalSearchParams, useFocusEffect } from \"expo-router\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, dangerColor, font } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

export default function IncidentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);

  const load = useCallback(async () => {
    try { setItem(await api.get(`/incidents/${id}`)); }
    catch (e: any) { toast(e.message, \"error\"); }
  }, [id, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resolve = async (status: string) => {
    try {
      await api.put(`/incidents/${id}`, { status });
      toast(`Marked ${status.replace(\"_\", \" \")}`, \"success\");
      load();
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AnimatedBackground />
        <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
          <ScreenHeader title=\"Incident\" />
          <Text style={{ color: colors.textSecondary }}>Loading…</Text>
        </SafeAreaView>
      </View>
    );
  }

  const c = dangerColor(item.danger_level);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"incident-detail-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Incident detail\" subtitle={new Date(item.created_at).toLocaleString()} />

          <GlassCard glow={c} style={{ alignItems: \"center\", paddingVertical: 28 }}>
            <View style={[styles.orb, { backgroundColor: c + \"22\", borderColor: c }]}>
              <Ionicons name=\"alert\" size={44} color={c} />
            </View>
            <Text style={{ color: c, marginTop: 12, ...font.h2 }}>{item.danger_level.toUpperCase()}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Threat {Math.round(item.threat_score * 100)}%</Text>
            <View style={styles.pillRow}>
              <View style={styles.pill}><Text style={styles.pillText}>Trigger: {item.trigger}</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>Duration: {item.duration_seconds}s</Text></View>
              <View style={[styles.pill, { borderColor: item.status === \"active\" ? colors.red + \"88\" : colors.green + \"88\" }]}>
                <Text style={[styles.pillText, { color: item.status === \"active\" ? colors.red : colors.green }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          </GlassCard>

          <Text style={styles.section}>Location</Text>
          <GlassCard>
            <Row icon=\"location\" label=\"Address\" value={item.address || \"Unknown\"} />
            <Row icon=\"navigate\" label=\"Latitude\" value={item.latitude?.toFixed(5) ?? \"—\"} />
            <Row icon=\"compass\" label=\"Longitude\" value={item.longitude?.toFixed(5) ?? \"—\"} last />
          </GlassCard>

          <Text style={styles.section}>Evidence</Text>
          <GlassCard>
            <Row icon=\"mic\" label=\"Audio\" value={item.audio_url ? \"Recorded\" : \"24s captured (mock)\"} />
            <Row icon=\"videocam\" label=\"Video\" value={item.video_url ? \"Recorded\" : \"24s captured (mock)\"} />
            <Row icon=\"document-text\" label=\"Notes\" value={item.notes || \"Auto-dispatched by SafeStreet AI\"} last />
          </GlassCard>

          {item.status === \"active\" && (
            <View style={{ gap: 10, marginTop: 16 }}>
              <GradientButton
                title=\"Mark resolved\"
                variant=\"success\"
                onPress={() => resolve(\"resolved\")}
                icon={<Ionicons name=\"checkmark\" size={20} color=\"#fff\" />}
                testID=\"incident-resolve\"
              />
              <GradientButton
                title=\"False alarm\"
                variant=\"ghost\"
                onPress={() => resolve(\"false_alarm\")}
                testID=\"incident-false-alarm\"
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Row({ icon, label, value, last }: any) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={{ color: colors.textSecondary, width: 90 }}>{label}</Text>
      <Text style={{ color: \"#fff\", flex: 1 }} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: \"center\", justifyContent: \"center\" },
  pillRow: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 8, marginTop: 12, justifyContent: \"center\" },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  pillText: { color: colors.textSecondary, fontSize: 12, fontWeight: \"700\", letterSpacing: 1 },
  section: { ...font.h4, color: \"#fff\", marginTop: 20, marginBottom: 10 },
  row: { flexDirection: \"row\", alignItems: \"center\", gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
"
