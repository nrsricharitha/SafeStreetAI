"import React, { useEffect, useState, useRef } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import Svg, { Circle, Path, Defs, LinearGradient as SvgLG, Stop } from \"react-native-svg\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { colors, font } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Point = { latitude: number; longitude: number; accuracy: number; timestamp: string };

export default function LocationScreen() {
  const { toast } = useToast();
  const [current, setCurrent] = useState<Point>({
    latitude: 28.6139, longitude: 77.209, accuracy: 8, timestamp: new Date().toISOString(),
  });
  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([]);
  const [sharing, setSharing] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const push = async (p: Point) => {
    try {
      await api.post(\"/locations\", {
        latitude: p.latitude, longitude: p.longitude, accuracy: p.accuracy,
      });
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!sharing) return;
    timer.current = setInterval(() => {
      setCurrent((prev) => {
        const next: Point = {
          latitude: prev.latitude + (Math.random() - 0.5) * 0.0006,
          longitude: prev.longitude + (Math.random() - 0.5) * 0.0006,
          accuracy: 6 + Math.random() * 6,
          timestamp: new Date().toISOString(),
        };
        setTrail((t) => [...t.slice(-24), { lat: next.latitude, lng: next.longitude }]);
        push(next);
        return next;
      });
    }, 3000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [sharing]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"location-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Live Location\" subtitle={sharing ? \"Sharing every 3s\" : \"Sharing paused\"} />

          <GlassCard style={{ padding: 0, overflow: \"hidden\" }} padded={false}>
            <PlaceholderMap
              lat={current.latitude}
              lng={current.longitude}
              trail={trail.length ? trail : [{ lat: current.latitude, lng: current.longitude }]}
            />
          </GlassCard>

          <View style={styles.grid}>
            <Metric label=\"Latitude\" value={current.latitude.toFixed(5)} icon=\"navigate\" />
            <Metric label=\"Longitude\" value={current.longitude.toFixed(5)} icon=\"compass\" />
            <Metric label=\"Accuracy\" value={`±${current.accuracy.toFixed(1)} m`} icon=\"scan\" />
            <Metric label=\"Updated\" value={new Date(current.timestamp).toLocaleTimeString()} icon=\"time\" />
          </View>

          <GlassCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: \"row\", alignItems: \"center\" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: \"#fff\", ...font.h4 }}>Location Sharing</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                  {sharing ? \"Guardians can see your position\" : \"Turn on to broadcast live\"}
                </Text>
              </View>
              <Pressable
                onPress={() => { setSharing((s) => !s); toast(sharing ? \"Sharing paused\" : \"Sharing resumed\", \"info\"); }}
                style={[styles.switch, sharing && styles.switchOn]}
                testID=\"location-share-toggle\"
              >
                <View style={[styles.knob, sharing && styles.knobOn]} />
              </Pressable>
            </View>
          </GlassCard>

          <GradientButton
            title=\"Share to guardians now\"
            icon={<Ionicons name=\"share-social\" size={20} color=\"#fff\" />}
            onPress={() => toast(\"Shared to primary guardian\", \"success\")}
            style={{ marginTop: 16 }}
            testID=\"location-share-now\"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({ label, value, icon }: any) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color={colors.cyan} />
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>{label}</Text>
      <Text style={{ color: \"#fff\", fontWeight: \"800\", fontSize: 15, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

// Simple SVG placeholder map — grid, roads, current position, trail.
function PlaceholderMap({ lat, lng, trail }: { lat: number; lng: number; trail: { lat: number; lng: number }[] }) {
  const W = 340, H = 260;
  const minLat = Math.min(...trail.map((p) => p.lat), lat) - 0.001;
  const maxLat = Math.max(...trail.map((p) => p.lat), lat) + 0.001;
  const minLng = Math.min(...trail.map((p) => p.lng), lng) - 0.001;
  const maxLng = Math.max(...trail.map((p) => p.lng), lng) + 0.001;
  const toX = (v: number) => ((v - minLng) / (maxLng - minLng)) * W;
  const toY = (v: number) => H - ((v - minLat) / (maxLat - minLat)) * H;

  const path = trail
    .map((p, i) => `${i === 0 ? \"M\" : \"L\"} ${toX(p.lng)} ${toY(p.lat)}`)
    .join(\" \");

  return (
    <View style={{ height: 260, backgroundColor: \"#0a0f1e\" }}>
      <Svg width=\"100%\" height={260} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio=\"xMidYMid slice\">
        <Defs>
          <SvgLG id=\"mapg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">
            <Stop offset=\"0%\" stopColor=\"#0a0e28\" />
            <Stop offset=\"100%\" stopColor=\"#040412\" />
          </SvgLG>
        </Defs>
        <Path d={`M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z`} fill=\"url(#mapg)\" />
        {/* Grid */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Path key={`h${i}`} d={`M 0 ${(i * H) / 10} L ${W} ${(i * H) / 10}`} stroke=\"rgba(255,255,255,0.05)\" strokeWidth={1} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <Path key={`v${i}`} d={`M ${(i * W) / 10} 0 L ${(i * W) / 10} ${H}`} stroke=\"rgba(255,255,255,0.05)\" strokeWidth={1} />
        ))}
        {/* Streets */}
        <Path d={`M 20 200 Q 100 100 220 130 T ${W - 10} 90`} stroke=\"rgba(0,229,255,0.25)\" strokeWidth={2} fill=\"none\" />
        <Path d={`M 10 60 Q 90 90 180 70 T ${W - 20} 180`} stroke=\"rgba(176,38,255,0.2)\" strokeWidth={2} fill=\"none\" />
        {/* Trail */}
        <Path d={path} stroke={colors.cyan} strokeWidth={3} fill=\"none\" strokeLinecap=\"round\" />
        {/* Current position */}
        <Circle cx={toX(lng)} cy={toY(lat)} r={16} fill={colors.cyan + \"40\"} />
        <Circle cx={toX(lng)} cy={toY(lat)} r={7} fill={colors.cyan} />
        <Circle cx={toX(lng)} cy={toY(lat)} r={3} fill=\"#fff\" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 10, marginTop: 16 },
  metric: {
    width: \"48%\", padding: 14, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  switch: {
    width: 52, height: 30, borderRadius: 15, backgroundColor: \"rgba(255,255,255,0.1)\",
    justifyContent: \"center\", padding: 3,
  },
  switchOn: { backgroundColor: colors.cyan },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: \"#fff\" },
  knobOn: { transform: [{ translateX: 22 }] },
});
"
