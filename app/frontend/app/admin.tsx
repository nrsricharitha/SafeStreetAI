"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useFocusEffect } from \"expo-router\";
import Svg, { Rect, Path } from \"react-native-svg\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, dangerColor, font } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

export default function Admin() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, i, r] = await Promise.all([
        api.get<any>(\"/admin/stats\"),
        api.get<any[]>(\"/admin/incidents\"),
        api.get<any[]>(\"/admin/reports\"),
      ]);
      setStats(s); setIncidents(i); setReports(r);
    } catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const buckets: Record<string, number> = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
  incidents.forEach((i) => { buckets[i.danger_level] = (buckets[i.danger_level] || 0) + 1; });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"admin-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Admin\" subtitle=\"Platform analytics\" />
          {!stats ? (
            <GlassCard>
              <Text style={{ color: colors.textSecondary }}>Loading…</Text>
            </GlassCard>
          ) : (
            <>
              <View style={styles.grid}>
                <Stat icon=\"people\" label=\"Users\" value={stats.users} tint={colors.cyan} />
                <Stat icon=\"alert\" label=\"Incidents\" value={stats.incidents} tint={colors.red} />
                <Stat icon=\"radio\" label=\"Live monitors\" value={stats.active_sessions} tint={colors.green} />
                <Stat icon=\"megaphone\" label=\"Reports\" value={stats.reports} tint={colors.purple} />
                <Stat icon=\"checkmark-circle\" label=\"Verified\" value={stats.verified_reports} tint={colors.amber} />
                <Stat icon=\"notifications\" label=\"Notifications\" value={stats.notifications} tint={colors.blue} />
              </View>

              <Text style={styles.section}>Incident distribution</Text>
              <GlassCard>
                <BarChart data={buckets} />
              </GlassCard>

              <Text style={styles.section}>Recent incidents</Text>
              {incidents.slice(0, 6).map((i) => (
                <GlassCard key={i.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                    <View style={[styles.dot, { backgroundColor: dangerColor(i.danger_level) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: \"#fff\", ...font.bodyBold }}>{i.danger_level.toUpperCase()} • {i.trigger}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(i.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={{ color: dangerColor(i.danger_level), fontWeight: \"800\" }}>{Math.round(i.threat_score * 100)}</Text>
                  </View>
                </GlassCard>
              ))}

              <Text style={styles.section}>Community reports</Text>
              {reports.slice(0, 5).map((r) => (
                <GlassCard key={r.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                    <Ionicons name=\"megaphone\" size={20} color={colors.purple} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: \"#fff\", ...font.bodyBold }}>{r.title}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{r.category} • {r.likes?.length || 0} likes</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({ icon, label, value, tint }: any) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint + \"22\" }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={{ color: \"#fff\", fontWeight: \"800\", fontSize: 22, marginTop: 6 }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const keys = [\"safe\", \"low\", \"medium\", \"high\", \"critical\"];
  const max = Math.max(1, ...Object.values(data));
  const W = 300, H = 140;
  const bw = W / keys.length - 12;
  return (
    <View style={{ paddingVertical: 8 }}>
      <Svg width=\"100%\" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio=\"xMidYMid meet\">
        {keys.map((k, i) => {
          const h = ((data[k] || 0) / max) * (H - 30);
          return (
            <React.Fragment key={k}>
              <Rect
                x={i * (bw + 12) + 6}
                y={H - h - 20}
                width={bw}
                height={h}
                rx={6}
                fill={dangerColor(k as any)}
                opacity={0.9}
              />
              <Path d={`M ${i * (bw + 12) + 6} ${H - 6} h ${bw}`} stroke=\"rgba(255,255,255,0.05)\" strokeWidth={1} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: \"row\", justifyContent: \"space-around\", marginTop: 4 }}>
        {keys.map((k) => (
          <Text key={k} style={{ color: colors.textSecondary, fontSize: 10, textTransform: \"uppercase\" }}>{k}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 10 },
  stat: {
    width: \"31%\", padding: 12, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  statIcon: { width: 32, height: 32, borderRadius: 12, alignItems: \"center\", justifyContent: \"center\" },
  section: { ...font.h4, color: \"#fff\", marginTop: 20, marginBottom: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
"
