"import React, { useCallback, useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import Svg, { Circle, Rect, Defs, RadialGradient, Stop } from \"react-native-svg\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Zone = { lat: number; lng: number; intensity: number; type: string };
type POI = { name: string; type: string; lat: number; lng: number };

export default function Heatmap() {
  const { toast } = useToast();
  const [mode, setMode] = useState<\"day\" | \"night\">(\"day\");
  const [zones, setZones] = useState<Zone[]>([]);
  const [poi, setPoi] = useState<POI[]>([]);

  const load = useCallback(async () => {
    try {
      const d = await api.get<any>(`/heatmap?mode=${mode}`);
      setZones(d.zones); setPoi(d.poi);
    } catch (e: any) { toast(e.message, \"error\"); }
  }, [mode, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"heatmap-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Crime Heatmap\" subtitle=\"Real-time risk zones in your city\" />

          <View style={styles.modeRow}>
            {([\"day\", \"night\"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                testID={`heatmap-mode-${m}`}
              >
                <Ionicons name={m === \"day\" ? \"sunny\" : \"moon\"} size={16} color={mode === m ? colors.cyan : colors.textSecondary} />
                <Text style={{ color: mode === m ? colors.cyan : colors.textSecondary, fontWeight: \"700\" }}>
                  {m === \"day\" ? \"Day\" : \"Night\"}
                </Text>
              </Pressable>
            ))}
          </View>

          <GlassCard padded={false} style={{ overflow: \"hidden\" }}>
            <HeatmapSvg zones={zones} poi={poi} />
          </GlassCard>

          <Text style={styles.section}>Legend</Text>
          <View style={{ gap: 8 }}>
            <Legend color={colors.red} label=\"High-risk zone\" />
            <Legend color={colors.amber} label=\"Medium-risk zone\" />
            <Legend color={colors.green} label=\"Safe zone\" />
            <Legend color={colors.blue} label=\"Crowded area\" />
          </View>

          <Text style={styles.section}>Nearby POI</Text>
          <View style={{ gap: 8 }}>
            {poi.map((p) => (
              <View key={p.name} style={styles.poiRow}>
                <Ionicons
                  name={p.type === \"police\" ? \"shield-checkmark\" : p.type === \"hospital\" ? \"medical\" : \"train\"}
                  size={18}
                  color={colors.cyan}
                />
                <Text style={{ color: \"#fff\", flex: 1, ...font.body }}>{p.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Legend({ color, label }: any) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ color: \"#fff\" }}>{label}</Text>
    </View>
  );
}

function HeatmapSvg({ zones, poi }: { zones: Zone[]; poi: POI[] }) {
  const W = 340, H = 300;
  if (!zones.length) return <View style={{ height: 300, backgroundColor: \"#0a0f1e\" }} />;
  const lats = zones.map((z) => z.lat);
  const lngs = zones.map((z) => z.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const toX = (v: number) => ((v - minLng) / (maxLng - minLng || 1)) * (W - 20) + 10;
  const toY = (v: number) => H - ((v - minLat) / (maxLat - minLat || 1)) * (H - 20) - 10;
  const colorFor = (t: string) =>
    t === \"high\" ? colors.red : t === \"medium\" ? colors.amber : t === \"crowded\" ? colors.blue : colors.green;

  return (
    <View style={{ height: 300, backgroundColor: \"#0a0f1e\" }}>
      <Svg width=\"100%\" height={300} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio=\"xMidYMid slice\">
        <Defs>
          <RadialGradient id=\"hg\" cx=\"50%\" cy=\"50%\" r=\"50%\">
            <Stop offset=\"0%\" stopOpacity={0.9} stopColor=\"#fff\" />
            <Stop offset=\"100%\" stopOpacity={0} stopColor=\"#fff\" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill=\"#050510\" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Rect key={`h${i}`} x={0} y={(i * H) / 12} width={W} height={0.5} fill=\"rgba(255,255,255,0.03)\" />
        ))}
        {zones.map((z, i) => (
          <Circle
            key={i}
            cx={toX(z.lng)}
            cy={toY(z.lat)}
            r={18 + z.intensity * 16}
            fill={colorFor(z.type)}
            opacity={0.28 + z.intensity * 0.5}
          />
        ))}
        {poi.map((p, i) => (
          <Circle key={i} cx={toX(p.lng)} cy={toY(p.lat)} r={6} fill=\"#fff\" stroke={colors.cyan} strokeWidth={2} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: \"row\", gap: 8, marginBottom: 12 },
  modeBtn: {
    flexDirection: \"row\", alignItems: \"center\", gap: 6,
    paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  modeBtnActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
  section: { ...font.h4, color: \"#fff\", marginTop: 20, marginBottom: 10 },
  legendRow: { flexDirection: \"row\", alignItems: \"center\", gap: 10 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  poiRow: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
});
"
