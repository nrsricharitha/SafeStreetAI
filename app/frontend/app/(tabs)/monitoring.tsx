"import React, { useCallback, useEffect, useRef, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from \"react-native\";
import { useRouter, useLocalSearchParams, useFocusEffect } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import * as Haptics from \"expo-haptics\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { RadarScanner } from \"@/src/components/RadarScanner\";
import { Waveform } from \"@/src/components/Waveform\";
import { ThreatMeter } from \"@/src/components/ThreatMeter\";
import { colors, dangerColor, font, radius, scoreToDanger } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { calm, escalate, sample, SensorSnapshot } from \"@/src/services/aiSimulator\";
import { useToast } from \"@/src/components/Toast\";

const SOS_THRESHOLD = 0.75;

export default function Monitoring() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useLocalSearchParams();
  const [snap, setSnap] = useState<SensorSnapshot>(sample());
  const [active, setActive] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<{ t: number; msg: string; level: string }[]>([]);
  const [demo, setDemo] = useState(false);
  const startedForDemo = useRef(false);

  const start = useCallback(async () => {
    try {
      const s = await api.post<any>(\"/monitoring/start\");
      setSession(s);
      setActive(true);
      calm();
      pushLog(\"Monitoring engaged. AI Sensors online.\", \"safe\");
    } catch (e: any) {
      toast(e.message, \"error\");
    }
  }, [toast]);

  const stop = useCallback(async () => {
    calm();
    if (session) {
      try { await api.post(`/monitoring/stop/${session.id}`); } catch { /* ignore */ }
    }
    setActive(false);
    setSession(null);
    pushLog(\"Monitoring stopped.\", \"safe\");
  }, [session]);

  const pushLog = (msg: string, level: string) => {
    setLogs((l) => [{ t: Date.now(), msg, level }, ...l].slice(0, 30));
  };

  // Poll sensors
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const s = sample();
      setSnap(s);
      if (s.threat >= SOS_THRESHOLD) {
        pushLog(`Threat spike ${Math.round(s.threat * 100)}%`, \"critical\");
        if (Platform.OS !== \"web\") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.push({
          pathname: \"/sos\",
          params: {
            trigger: demo ? \"demo\" : \"auto\",
            threat: String(s.threat.toFixed(2)),
            level: scoreToDanger(s.threat),
          },
        });
        stop();
      } else if (s.threat > 0.5 && Math.random() > 0.7) {
        pushLog(`Motion anomaly detected ${Math.round(s.motion)}%`, \"medium\");
      }
    }, 2000);
    return () => clearInterval(id);
  }, [active, demo, router, stop]);

  // Demo mode escalation ladder
  useEffect(() => {
    if (!demo || !active) return;
    const steps = [
      { ms: 800, msg: \"You've started walking. All clear.\", level: \"safe\", delta: 0 },
      { ms: 2200, msg: \"Pace increasing — running detected.\", level: \"low\", delta: 0.15 },
      { ms: 3800, msg: \"Loud scream detected. Confidence 92%.\", level: \"high\", delta: 0.35 },
      { ms: 5400, msg: \"Threat score rising rapidly.\", level: \"high\", delta: 0.25 },
      { ms: 6800, msg: \"Auto-SOS countdown starting…\", level: \"critical\", delta: 0.4 },
    ];
    const timers = steps.map((s) =>
      setTimeout(() => { pushLog(s.msg, s.level); escalate(s.delta); }, s.ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [demo, active]);

  // Kick off demo when navigating with ?demo=1
  useFocusEffect(useCallback(() => {
    if (params.demo === \"1\" && !startedForDemo.current) {
      startedForDemo.current = true;
      setDemo(true);
      start();
      toast(\"Demo mode running — auto SOS in ~7s\", \"info\");
    }
    return () => { startedForDemo.current = false; };
  }, [params.demo, start, toast]));

  const level = scoreToDanger(snap.threat);
  const levelColor = dangerColor(level);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"monitoring-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\"]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>AI Guardian</Text>
              <Text style={styles.title}>Live Monitoring</Text>
            </View>
            <View style={[styles.statusPill, { borderColor: active ? colors.green : colors.textMuted }]}>
              <View style={[styles.dot, { backgroundColor: active ? colors.green : colors.textMuted }]} />
              <Text style={{ color: active ? colors.green : colors.textSecondary, fontSize: 12, fontWeight: \"700\" }}>
                {active ? \"ONLINE\" : \"IDLE\"}
              </Text>
            </View>
          </View>

          <GlassCard style={{ alignItems: \"center\", paddingVertical: 24 }} glow={levelColor}>
            <RadarScanner size={220} color={levelColor} active={active} />
            <View style={{ marginTop: 20 }}>
              <ThreatMeter value={snap.threat} level={level} size={200} />
            </View>
          </GlassCard>

          <View style={styles.sensorGrid}>
            <Sensor icon=\"mic\" label=\"Noise\" value={`${Math.round(snap.noise)} dB`} tint={colors.cyan} />
            <Sensor icon=\"walk\" label=\"Motion\" value={`${Math.round(snap.motion)}%`} tint={colors.blue} />
            <Sensor icon=\"speedometer\" label=\"Speed\" value={`${snap.running.toFixed(1)} km/h`} tint={colors.purple} />
            <Sensor icon=\"heart\" label=\"Heart\" value={`${Math.round(snap.heartRate)} bpm`} tint={colors.red} />
            <Sensor icon=\"pulse\" label=\"Stress\" value={`${Math.round(snap.stress)}%`} tint={colors.amber} />
            <Sensor icon=\"chatbubble\" label=\"Voice Conf.\" value={`${Math.round(snap.voiceConfidence)}%`} tint={colors.green} />
          </View>

          <GlassCard style={{ marginTop: 16 }}>
            <Text style={styles.cardTitle}>Audio waveform</Text>
            <Text style={styles.cardSub}>Listening for distress cues</Text>
            <View style={{ marginTop: 12 }}>
              <Waveform intensity={Math.max(0.2, snap.noise / 100)} />
            </View>
          </GlassCard>

          <GlassCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: \"row\", alignItems: \"center\", justifyContent: \"space-between\" }}>
              <Text style={styles.cardTitle}>Live logs</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{logs.length} events</Text>
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              {logs.length === 0 && (
                <Text style={{ color: colors.textMuted }}>No events yet. Press start to begin scanning.</Text>
              )}
              {logs.slice(0, 6).map((l, i) => (
                <View key={i} style={styles.logRow}>
                  <View style={[styles.logDot, { backgroundColor: dangerColor(l.level as any) }]} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(l.t).toLocaleTimeString()}  {l.msg}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {!active ? (
            <GradientButton
              title=\"Start Monitoring\"
              icon={<Ionicons name=\"play\" size={20} color=\"#fff\" />}
              onPress={start}
              testID=\"monitor-start-button\"
              style={{ marginTop: 20 }}
            />
          ) : (
            <GradientButton
              title=\"Stop Monitoring\"
              variant=\"ghost\"
              icon={<Ionicons name=\"stop\" size={20} color=\"#fff\" />}
              onPress={stop}
              testID=\"monitor-stop-button\"
              style={{ marginTop: 20 }}
            />
          )}

          <Pressable
            onPress={() => router.push({ pathname: \"/sos\", params: { trigger: \"manual\" } })}
            style={styles.manualSos}
            testID=\"monitor-panic-button\"
          >
            <Ionicons name=\"warning\" size={20} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: \"800\", letterSpacing: 1 }}>PANIC — TRIGGER SOS NOW</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Sensor({ icon, label, value, tint }: any) {
  return (
    <View style={styles.sensor}>
      <View style={[styles.sensorIcon, { backgroundColor: tint + \"22\" }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: \"#fff\", fontWeight: \"700\", fontSize: 15 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: \"row\", alignItems: \"center\", marginBottom: 16 },
  eyebrow: { ...font.label, color: colors.textSecondary },
  title: { ...font.h2, color: \"#fff\", marginTop: 4 },
  statusPill: {
    flexDirection: \"row\", alignItems: \"center\", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sensorGrid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 10, marginTop: 16 },
  sensor: {
    width: \"48%\", flexDirection: \"row\", alignItems: \"center\", gap: 10,
    padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  sensorIcon: { width: 34, height: 34, borderRadius: 12, alignItems: \"center\", justifyContent: \"center\" },
  cardTitle: { color: \"#fff\", ...font.h4 },
  cardSub: { color: colors.textSecondary, marginTop: 4 },
  logRow: { flexDirection: \"row\", alignItems: \"center\", gap: 10 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  manualSos: {
    marginTop: 14, padding: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.red + \"55\", backgroundColor: colors.red + \"18\",
    alignItems: \"center\", flexDirection: \"row\", justifyContent: \"center\", gap: 10,
  },
});
"
