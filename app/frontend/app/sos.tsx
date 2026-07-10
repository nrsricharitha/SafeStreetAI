"import React, { useEffect, useState, useRef } from \"react\";
import { View, Text, StyleSheet, Pressable, Platform } from \"react-native\";
import { useRouter, useLocalSearchParams } from \"expo-router\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import * as Haptics from \"expo-haptics\";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring,
} from \"react-native-reanimated\";
import { SafeAreaView } from \"react-native-safe-area-context\";

import { colors, gradients, font, dangerColor, DangerLevel, scoreToDanger } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";
import { calm } from \"@/src/services/aiSimulator\";

const COUNTDOWN = 10;

export default function SOS() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useLocalSearchParams<{ trigger?: string; threat?: string; level?: string }>();
  const trigger = params.trigger || \"manual\";
  const threatScore = params.threat ? parseFloat(params.threat) : trigger === \"manual\" ? 0.9 : 0.85;
  const level: DangerLevel = (params.level as DangerLevel) || scoreToDanger(threatScore);

  const [seconds, setSeconds] = useState(COUNTDOWN);
  const [dispatched, setDispatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelled = useRef(false);
  const pulse = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    flash.value = withRepeat(withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
    if (Platform.OS !== \"web\") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    const iv = setInterval(() => {
      setSeconds((s) => {
        if (cancelled.current) return s;
        if (s <= 1) {
          clearInterval(iv);
          dispatch();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = async () => {
    if (dispatched || cancelled.current) return;
    setBusy(true);
    try {
      await api.post(\"/incidents\", {
        threat_score: threatScore,
        danger_level: level,
        trigger,
        duration_seconds: COUNTDOWN,
        latitude: 28.6139,
        longitude: 77.209,
        address: \"MG Road, New Delhi\",
        notes: \"Auto-dispatched by SafeStreet AI\",
      });
      setDispatched(true);
      calm();
      if (Platform.OS !== \"web\") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      toast(e.message || \"Dispatch failed\", \"error\");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    cancelled.current = true;
    calm();
    router.back();
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  if (dispatched) {
    return (
      <View style={styles.root} testID=\"sos-success-screen\">
        <LinearGradient colors={[\"#001f10\", \"#003a1c\", \"#001a08\"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: \"center\", alignItems: \"center\" }}>
          <Animated.View style={[styles.checkOrb, pulseStyle]}>
            <Ionicons name=\"checkmark\" size={80} color=\"#fff\" />
          </Animated.View>
          <Text style={styles.dispatchedTitle}>Guardians alerted</Text>
          <Text style={styles.dispatchedSub}>Live location is being shared with your emergency contacts. Stay on the line.</Text>

          <View style={styles.statusList}>
            <StatusItem icon=\"location\" label=\"Live location sharing\" ok />
            <StatusItem icon=\"mic\" label=\"Audio recording (24s)\" ok />
            <StatusItem icon=\"videocam\" label=\"Video capture (24s)\" ok />
            <StatusItem icon=\"flashlight\" label=\"Flashlight strobe\" ok />
            <StatusItem icon=\"people\" label=\"4 guardians notified\" ok />
            <StatusItem icon=\"document-text\" label=\"Incident report generated\" ok />
          </View>

          <View style={{ marginTop: 24, width: \"100%\", gap: 10 }}>
            <Pressable onPress={() => router.replace(\"/(tabs)/dashboard\")} style={styles.homeBtn} testID=\"sos-done-home\">
              <Text style={{ color: \"#fff\", fontWeight: \"800\" }}>Back to Home</Text>
            </Pressable>
            <Pressable onPress={() => router.replace(\"/incidents\")} style={styles.ghostBtn} testID=\"sos-view-incidents\">
              <Text style={{ color: \"#fff\", fontWeight: \"700\" }}>View incident</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root} testID=\"sos-screen\">
      <LinearGradient colors={gradients.danger} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: \"#000\" }, flashStyle]} />
      <SafeAreaView style={{ flex: 1, padding: 24 }}>
        <Text style={styles.eyebrow}>EMERGENCY DISPATCH</Text>
        <Text style={styles.title}>
          {trigger === \"auto\" ? \"AI Detected Danger\" : trigger === \"voice\" ? \"Voice Trigger\" : trigger === \"demo\" ? \"Demo Emergency\" : \"Manual Panic\"}
        </Text>
        <Text style={styles.subtitle}>
          Guardians will be alerted in
        </Text>
        <Animated.View style={[styles.countdownOrb, pulseStyle]}>
          <Text style={styles.countText}>{seconds}</Text>
        </Animated.View>
        <Text style={styles.threatText}>
          Threat level: <Text style={{ color: dangerColor(level), fontWeight: \"800\" }}>{level.toUpperCase()}</Text>
          {\"  •  \"}Score: {Math.round(threatScore * 100)}%
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 12 }}>
          <Pressable onPress={cancel} style={styles.cancelBtn} testID=\"sos-cancel-button\" disabled={busy}>
            <Text style={styles.cancelText}>I&apos;M SAFE — CANCEL</Text>
          </Pressable>
          <Pressable onPress={dispatch} style={styles.sendNowBtn} testID=\"sos-send-now\" disabled={busy}>
            <Ionicons name=\"alert\" size={20} color=\"#fff\" />
            <Text style={{ color: \"#fff\", fontWeight: \"800\", letterSpacing: 1 }}>SEND SOS NOW</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatusItem({ icon, label, ok }: any) {
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusDot}><Ionicons name={icon} size={14} color={colors.green} /></View>
      <Text style={{ color: \"#fff\", flex: 1 }}>{label}</Text>
      <Ionicons name={ok ? \"checkmark-circle\" : \"ellipsis-horizontal\"} size={20} color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.redDeep },
  eyebrow: {
    color: \"rgba(255,255,255,0.8)\", fontSize: 12, fontWeight: \"800\",
    letterSpacing: 3, marginTop: 20,
  },
  title: { color: \"#fff\", fontSize: 40, fontWeight: \"900\", marginTop: 8, letterSpacing: -1 },
  subtitle: { color: \"rgba(255,255,255,0.85)\", fontSize: 16, marginTop: 12 },
  countdownOrb: {
    alignSelf: \"center\", marginTop: 30, width: 220, height: 220, borderRadius: 110,
    backgroundColor: \"rgba(0,0,0,0.35)\", borderWidth: 6, borderColor: \"#fff\",
    alignItems: \"center\", justifyContent: \"center\",
    shadowColor: \"#fff\", shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 },
  },
  countText: { color: \"#fff\", fontSize: 112, fontWeight: \"900\", letterSpacing: -4 },
  threatText: { color: \"rgba(255,255,255,0.9)\", textAlign: \"center\", marginTop: 22, fontSize: 15 },
  cancelBtn: {
    padding: 18, borderRadius: 999, backgroundColor: \"#fff\",
    alignItems: \"center\", justifyContent: \"center\",
  },
  cancelText: { color: colors.red, fontWeight: \"900\", letterSpacing: 2, fontSize: 16 },
  sendNowBtn: {
    flexDirection: \"row\", gap: 10, padding: 16, borderRadius: 999,
    borderWidth: 2, borderColor: \"#fff\", alignItems: \"center\", justifyContent: \"center\",
  },
  // Dispatched
  checkOrb: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: colors.green,
    alignItems: \"center\", justifyContent: \"center\",
    shadowColor: colors.green, shadowOpacity: 0.8, shadowRadius: 40, shadowOffset: { width: 0, height: 0 },
  },
  dispatchedTitle: { color: \"#fff\", fontSize: 32, fontWeight: \"800\", marginTop: 24, textAlign: \"center\" },
  dispatchedSub: { color: \"rgba(255,255,255,0.85)\", textAlign: \"center\", marginTop: 8, paddingHorizontal: 16 },
  statusList: { marginTop: 30, gap: 10, width: \"100%\" },
  statusRow: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: \"rgba(255,255,255,0.15)\", backgroundColor: \"rgba(0,0,0,0.25)\",
  },
  statusDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: \"rgba(0,255,136,0.15)\", alignItems: \"center\", justifyContent: \"center\",
  },
  homeBtn: {
    padding: 16, borderRadius: 999, backgroundColor: colors.green,
    alignItems: \"center\", justifyContent: \"center\",
  },
  ghostBtn: {
    padding: 16, borderRadius: 999, borderWidth: 2, borderColor: \"rgba(255,255,255,0.4)\",
    alignItems: \"center\", justifyContent: \"center\",
  },
});
"
