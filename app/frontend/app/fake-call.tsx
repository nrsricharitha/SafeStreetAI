"import React, { useEffect, useState, useRef } from \"react\";
import { View, Text, StyleSheet, Pressable, Image } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { useRouter } from \"expo-router\";
import { Ionicons } from \"@expo/vector-icons\";
import { LinearGradient } from \"expo-linear-gradient\";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from \"react-native-reanimated\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font, gradients } from \"@/src/theme\";

const CALLERS = [
  { id: \"mom\", name: \"Mom\", relation: \"Mother\", photo: \"https://images.pexels.com/photos/16857685/pexels-photo-16857685.jpeg?w=400\" },
  { id: \"boss\", name: \"Priya (Boss)\", relation: \"Manager\", photo: \"https://images.pexels.com/photos/31747504/pexels-photo-31747504.jpeg?w=400\" },
  { id: \"police\", name: \"Officer Kumar\", relation: \"Local Police\", photo: undefined },
  { id: \"dad\", name: \"Dad\", relation: \"Father\", photo: undefined },
];

const DELAYS = [
  { label: \"Immediate\", ms: 0 },
  { label: \"5 sec\", ms: 5000 },
  { label: \"15 sec\", ms: 15000 },
  { label: \"30 sec\", ms: 30000 },
];

export default function FakeCall() {
  const [caller, setCaller] = useState(CALLERS[0]);
  const [ringing, setRinging] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [timer, setTimer] = useState(0);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const callTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (callTimer.current) clearInterval(callTimer.current);
    if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
  }, []);

  const trigger = (ms: number) => {
    setScheduled(ms > 0 ? Date.now() + ms : null);
    if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
    scheduleTimer.current = setTimeout(() => {
      setRinging(true);
      setScheduled(null);
    }, ms);
  };

  const accept = () => {
    setRinging(false);
    setInCall(true);
    setTimer(0);
    callTimer.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const end = () => {
    setInCall(false); setRinging(false);
    if (callTimer.current) clearInterval(callTimer.current);
    setTimer(0);
  };

  if (ringing) return <RingingScreen caller={caller} onAccept={accept} onReject={end} />;
  if (inCall) return <InCallScreen caller={caller} timer={timer} onEnd={end} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"fake-call-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScreenHeader title=\"Fake Call\" subtitle=\"Instantly escape uncomfortable situations\" />

        <Text style={styles.section}>Choose caller</Text>
        <View style={{ gap: 10 }}>
          {CALLERS.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCaller(c)}
              testID={`caller-${c.id}`}
            >
              <GlassCard style={caller.id === c.id ? { borderColor: colors.borderActive, borderWidth: 1 } : undefined}>
                <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                  <View style={styles.avatar}>
                    {c.photo ? <Image source={{ uri: c.photo }} style={{ width: \"100%\", height: \"100%\", borderRadius: 24 }} /> : <Ionicons name=\"person\" size={20} color=\"#fff\" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: \"#fff\", ...font.bodyBold }}>{c.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{c.relation}</Text>
                  </View>
                  {caller.id === c.id && <Ionicons name=\"checkmark-circle\" size={22} color={colors.cyan} />}
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Schedule</Text>
        <View style={{ flexDirection: \"row\", flexWrap: \"wrap\", gap: 10 }}>
          {DELAYS.map((d) => (
            <Pressable key={d.label} onPress={() => trigger(d.ms)} style={styles.delay} testID={`delay-${d.label}`}>
              <Ionicons name={d.ms === 0 ? \"call\" : \"timer\"} size={16} color={colors.cyan} />
              <Text style={{ color: \"#fff\", fontWeight: \"700\" }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        {scheduled !== null && (
          <GlassCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 10 }}>
              <View style={styles.dot} />
              <Text style={{ color: \"#fff\" }}>Call incoming from {caller.name} in {Math.max(0, Math.round((scheduled - Date.now()) / 1000))}s</Text>
            </View>
          </GlassCard>
        )}

        <GradientButton
          title=\"Ring me now\"
          onPress={() => trigger(0)}
          icon={<Ionicons name=\"call\" size={20} color=\"#fff\" />}
          style={{ marginTop: 20 }}
          testID=\"fake-call-ring-now\"
        />
      </SafeAreaView>
    </View>
  );
}

function RingingScreen({ caller, onAccept, onReject }: any) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [scale]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: \"#000\" }} testID=\"fake-call-ringing\">
      <LinearGradient colors={[\"#0a0a20\", \"#000\"]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, alignItems: \"center\", padding: 24 }} edges={[\"top\", \"bottom\"]}>
        <Text style={styles.incomingLabel}>Incoming call</Text>
        <Animated.View style={[styles.bigAvatar, st]}>
          {caller.photo ? (
            <Image source={{ uri: caller.photo }} style={{ width: \"100%\", height: \"100%\", borderRadius: 90 }} />
          ) : (
            <Ionicons name=\"person\" size={80} color=\"#fff\" />
          )}
        </Animated.View>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerRelation}>{caller.relation} • Mobile</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: \"row\", gap: 60 }}>
          <Pressable onPress={onReject} style={[styles.callBtn, { backgroundColor: colors.red }]} testID=\"fake-call-reject\">
            <Ionicons name=\"call\" size={30} color=\"#fff\" style={{ transform: [{ rotate: \"135deg\" }] }} />
          </Pressable>
          <Pressable onPress={onAccept} style={[styles.callBtn, { backgroundColor: colors.green }]} testID=\"fake-call-accept\">
            <Ionicons name=\"call\" size={30} color=\"#fff\" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function InCallScreen({ caller, timer, onEnd }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: \"#000\" }} testID=\"fake-call-active\">
      <LinearGradient colors={[\"#0a0a20\", \"#000\"]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, alignItems: \"center\", padding: 24 }} edges={[\"top\", \"bottom\"]}>
        <Text style={styles.incomingLabel}>In call</Text>
        <View style={styles.bigAvatar}>
          {caller.photo ? (
            <Image source={{ uri: caller.photo }} style={{ width: \"100%\", height: \"100%\", borderRadius: 90 }} />
          ) : (
            <Ionicons name=\"person\" size={80} color=\"#fff\" />
          )}
        </View>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerRelation}>
          {Math.floor(timer / 60).toString().padStart(2, \"0\")}:{(timer % 60).toString().padStart(2, \"0\")}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onEnd} style={[styles.callBtn, { backgroundColor: colors.red }]} testID=\"fake-call-end\">
          <Ionicons name=\"call\" size={30} color=\"#fff\" style={{ transform: [{ rotate: \"135deg\" }] }} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { ...font.h4, color: \"#fff\", marginTop: 20, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.purple + \"44\", alignItems: \"center\", justifyContent: \"center\", overflow: \"hidden\" },
  delay: {
    flexDirection: \"row\", gap: 6, alignItems: \"center\", paddingHorizontal: 14, height: 44,
    borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cyan },
  incomingLabel: { color: colors.textSecondary, fontSize: 13, letterSpacing: 2, marginTop: 30 },
  bigAvatar: {
    marginTop: 30, width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.purple + \"44\", alignItems: \"center\", justifyContent: \"center\", overflow: \"hidden\",
    borderWidth: 3, borderColor: \"rgba(255,255,255,0.2)\",
  },
  callerName: { color: \"#fff\", fontSize: 32, fontWeight: \"800\", marginTop: 24 },
  callerRelation: { color: colors.textSecondary, marginTop: 6 },
  callBtn: {
    width: 80, height: 80, borderRadius: 40, alignItems: \"center\", justifyContent: \"center\",
    shadowColor: \"#fff\", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
});
"
