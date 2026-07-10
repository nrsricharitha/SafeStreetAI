"import React, { useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import Svg, { Path, Circle, Defs, LinearGradient as SvgLG, Stop } from \"react-native-svg\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, dangerColor, font, scoreToDanger } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Route = {
  id: string;
  name: string;
  risk_score: number;
  eta_minutes: number;
  distance_km: number;
  street_lighting: number;
  crowd_density: number;
  waypoints: { lat: number; lng: number }[];
};

export default function SafeRoute() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [nearby, setNearby] = useState<any>({ police_stations: [], hospitals: [], metro: [] });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any>(
          \"/routes/plan?from_lat=28.6139&from_lng=77.209&to_lat=28.62&to_lng=77.22\"
        );
        setRoutes(data.routes);
        setSelected(data.routes[0]?.id ?? null);
        setNearby(data.nearby);
      } catch (e: any) { toast(e.message, \"error\"); }
    })();
  }, [toast]);

  const active = routes.find((r) => r.id === selected);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"safe-route-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Safe Route\" subtitle=\"AI-scored paths to your destination\" />

          <GlassCard padded={false} style={{ overflow: \"hidden\" }}>
            <RouteMap routes={routes} selectedId={selected} />
          </GlassCard>

          <View style={{ marginTop: 16, gap: 10 }}>
            {routes.map((r) => (
              <Pressable key={r.id} onPress={() => setSelected(r.id)} testID={`route-${r.name.toLowerCase()}`}>
                <GlassCard style={selected === r.id ? { borderColor: colors.borderActive, borderWidth: 1 } : undefined}>
                  <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                    <View style={[styles.rIcon, { backgroundColor: dangerColor(scoreToDanger(r.risk_score)) + \"22\" }]}>
                      <Ionicons name=\"navigate\" size={20} color={dangerColor(scoreToDanger(r.risk_score))} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: \"#fff\", ...font.h4 }}>{r.name} route</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        {r.eta_minutes} min • {r.distance_km} km • Lighting {r.street_lighting}%
                      </Text>
                    </View>
                    <View style={{ alignItems: \"flex-end\" }}>
                      <Text style={{ color: dangerColor(scoreToDanger(r.risk_score)), fontWeight: \"800\", fontSize: 18 }}>
                        {Math.round(r.risk_score * 100)}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: \"700\", letterSpacing: 1 }}>RISK</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>

          {active && (
            <>
              <Text style={styles.section}>Along this route</Text>
              <View style={styles.pillRow}>
                <Metric icon=\"bulb\" label=\"Lighting\" value={`${active.street_lighting}%`} />
                <Metric icon=\"people\" label=\"Crowd\" value={`${active.crowd_density}%`} />
                <Metric icon=\"time\" label=\"ETA\" value={`${active.eta_minutes}m`} />
              </View>
            </>
          )}

          <Text style={styles.section}>Nearby help</Text>
          <NearbyRow items={nearby.police_stations} icon=\"shield-checkmark\" tint={colors.blue} />
          <NearbyRow items={nearby.hospitals} icon=\"medical\" tint={colors.red} />
          <NearbyRow items={nearby.metro} icon=\"train\" tint={colors.purple} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function NearbyRow({ items, icon, tint }: any) {
  return (
    <View style={{ gap: 8, marginBottom: 8 }}>
      {items.map((n: any) => (
        <View key={n.name} style={styles.nearRow}>
          <View style={[styles.rIcon, { backgroundColor: tint + \"22\", width: 34, height: 34 }]}>
            <Ionicons name={icon} size={16} color={tint} />
          </View>
          <Text style={{ color: \"#fff\", flex: 1 }}>{n.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{n.distance_km} km</Text>
        </View>
      ))}
    </View>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={16} color={colors.cyan} />
      <Text style={{ color: \"#fff\", ...font.bodyBold }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function RouteMap({ routes, selectedId }: { routes: Route[]; selectedId: string | null }) {
  const W = 340, H = 220;
  if (!routes.length) return <View style={{ height: 220, backgroundColor: \"#0a0f1e\" }} />;
  const all = routes.flatMap((r) => r.waypoints);
  const minLat = Math.min(...all.map((p) => p.lat));
  const maxLat = Math.max(...all.map((p) => p.lat));
  const minLng = Math.min(...all.map((p) => p.lng));
  const maxLng = Math.max(...all.map((p) => p.lng));
  const toX = (v: number) => ((v - minLng) / (maxLng - minLng || 1)) * (W - 40) + 20;
  const toY = (v: number) => H - ((v - minLat) / (maxLat - minLat || 1)) * (H - 40) - 20;

  return (
    <View style={{ height: 220, backgroundColor: \"#0a0f1e\" }}>
      <Svg width=\"100%\" height={220} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio=\"xMidYMid meet\">
        <Defs>
          <SvgLG id=\"rmg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">
            <Stop offset=\"0%\" stopColor=\"#0a0e28\" />
            <Stop offset=\"100%\" stopColor=\"#040412\" />
          </SvgLG>
        </Defs>
        <Path d={`M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z`} fill=\"url(#rmg)\" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Path key={i} d={`M 0 ${(i * H) / 8} L ${W} ${(i * H) / 8}`} stroke=\"rgba(255,255,255,0.04)\" strokeWidth={1} />
        ))}
        {routes.map((r) => {
          const isSel = r.id === selectedId;
          const c = dangerColor(scoreToDanger(r.risk_score));
          const d = r.waypoints.map((p, i) => `${i === 0 ? \"M\" : \"L\"} ${toX(p.lng)} ${toY(p.lat)}`).join(\" \");
          return (
            <Path
              key={r.id}
              d={d}
              stroke={isSel ? c : c + \"88\"}
              strokeWidth={isSel ? 5 : 3}
              fill=\"none\"
              strokeLinecap=\"round\"
              strokeDasharray={isSel ? undefined : \"6 6\"}
            />
          );
        })}
        {routes[0] && (
          <>
            <Circle cx={toX(routes[0].waypoints[0].lng)} cy={toY(routes[0].waypoints[0].lat)} r={9} fill={colors.green} />
            <Circle cx={toX(routes[0].waypoints[routes[0].waypoints.length - 1].lng)} cy={toY(routes[0].waypoints[routes[0].waypoints.length - 1].lat)} r={9} fill={colors.red} />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rIcon: { width: 42, height: 42, borderRadius: 21, alignItems: \"center\", justifyContent: \"center\" },
  section: { ...font.h4, color: \"#fff\", marginTop: 24, marginBottom: 10 },
  pillRow: { flexDirection: \"row\", gap: 10 },
  pill: {
    flex: 1, alignItems: \"center\", padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\", gap: 4,
  },
  nearRow: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
});
"
