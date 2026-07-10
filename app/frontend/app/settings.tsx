"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useFocusEffect } from \"expo-router\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type S = {
  dark_mode: boolean;
  notifications_enabled: boolean;
  voice_detection: boolean;
  auto_sos: boolean;
  sos_threshold: number;
  emergency_delay: number;
  location_permission: boolean;
  microphone_permission: boolean;
  battery_optimization: boolean;
  language: string;
};

const DEFAULT: S = {
  dark_mode: true, notifications_enabled: true, voice_detection: true, auto_sos: true,
  sos_threshold: 0.75, emergency_delay: 10, location_permission: true,
  microphone_permission: true, battery_optimization: false, language: \"en\",
};

export default function Settings() {
  const { toast } = useToast();
  const [s, setS] = useState<S>(DEFAULT);

  const load = useCallback(async () => {
    try { const d = await api.get<S>(\"/settings\"); setS({ ...DEFAULT, ...d }); }
    catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = async (patch: Partial<S>) => {
    setS((prev) => ({ ...prev, ...patch }));
    try { await api.put(\"/settings\", patch); }
    catch (e: any) { toast(e.message, \"error\"); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"settings-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ScreenHeader title=\"Settings\" subtitle=\"Customize your guardian\" />

          <Section title=\"Appearance\">
            <Toggle icon=\"moon\" label=\"Dark mode\" value={s.dark_mode} onChange={(v) => update({ dark_mode: v })} testID=\"setting-dark\" />
          </Section>

          <Section title=\"Safety\">
            <Toggle icon=\"shield-checkmark\" label=\"Automatic SOS\" value={s.auto_sos} onChange={(v) => update({ auto_sos: v })} testID=\"setting-auto-sos\" />
            <Toggle icon=\"mic\" label=\"Voice detection\" value={s.voice_detection} onChange={(v) => update({ voice_detection: v })} testID=\"setting-voice\" />
            <Stepper label=\"Emergency delay\" value={s.emergency_delay} suffix=\"s\" min={5} max={30} step={5}
              onChange={(v) => update({ emergency_delay: v })} testID=\"setting-delay\" />
            <Stepper label=\"SOS threshold\" value={Math.round(s.sos_threshold * 100)} suffix=\"%\" min={50} max={95} step={5}
              onChange={(v) => update({ sos_threshold: v / 100 })} testID=\"setting-threshold\" />
          </Section>

          <Section title=\"Permissions\">
            <Toggle icon=\"location\" label=\"Location\" value={s.location_permission} onChange={(v) => update({ location_permission: v })} testID=\"setting-loc\" />
            <Toggle icon=\"mic-outline\" label=\"Microphone\" value={s.microphone_permission} onChange={(v) => update({ microphone_permission: v })} testID=\"setting-mic\" />
            <Toggle icon=\"notifications\" label=\"Push notifications\" value={s.notifications_enabled} onChange={(v) => update({ notifications_enabled: v })} testID=\"setting-push\" />
            <Toggle icon=\"battery-charging\" label=\"Optimize battery\" value={s.battery_optimization} onChange={(v) => update({ battery_optimization: v })} testID=\"setting-battery\" />
          </Section>

          <Section title=\"Language\">
            <View style={styles.row}>
              <Ionicons name=\"language\" size={18} color={colors.textSecondary} />
              <Text style={{ color: \"#fff\", flex: 1 }}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[\"en\", \"hi\", \"es\", \"fr\"].map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => update({ language: l })}
                    style={[styles.langChip, s.language === l && styles.langChipActive, { flexShrink: 0 }]}
                    testID={`setting-lang-${l}`}
                  >
                    <Text style={{ color: s.language === l ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>
                      {l.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Section>

          <Section title=\"About\">
            <Link icon=\"document-text\" label=\"Privacy Policy\" testID=\"setting-privacy\" />
            <Link icon=\"book\" label=\"Terms of Service\" testID=\"setting-terms\" />
            <Link icon=\"information-circle\" label=\"About SafeStreet AI\" testID=\"setting-about\" sub=\"v1.0.0 · Built for judges\" />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, children }: any) {
  return (
    <View>
      <Text style={styles.section}>{title}</Text>
      <GlassCard style={{ marginBottom: 8 }}>
        <View>{children}</View>
      </GlassCard>
    </View>
  );
}

function Toggle({ icon, label, value, onChange, testID }: any) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={{ color: \"#fff\", flex: 1 }}>{label}</Text>
      <Pressable onPress={() => onChange(!value)} style={[styles.switch, value && styles.switchOn]} testID={testID}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </Pressable>
    </View>
  );
}

function Stepper({ label, value, suffix, min, max, step, onChange, testID }: any) {
  return (
    <View style={styles.row}>
      <Text style={{ color: \"#fff\", flex: 1 }}>{label}</Text>
      <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 8 }}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.stepBtn}
          testID={`${testID}-down`}
        >
          <Ionicons name=\"remove\" size={14} color=\"#fff\" />
        </Pressable>
        <Text style={{ color: \"#fff\", fontWeight: \"700\", minWidth: 44, textAlign: \"center\" }}>{value}{suffix}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          style={styles.stepBtn}
          testID={`${testID}-up`}
        >
          <Ionicons name=\"add\" size={14} color=\"#fff\" />
        </Pressable>
      </View>
    </View>
  );
}

function Link({ icon, label, sub, testID }: any) {
  return (
    <Pressable style={styles.row} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: \"#fff\" }}>{label}</Text>
        {sub && <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Ionicons name=\"chevron-forward\" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { ...font.h4, color: \"#fff\", marginTop: 16, marginBottom: 10 },
  row: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12,
    paddingVertical: 12,
  },
  switch: {
    width: 52, height: 30, borderRadius: 15, backgroundColor: \"rgba(255,255,255,0.1)\",
    justifyContent: \"center\", padding: 3,
  },
  switchOn: { backgroundColor: colors.cyan },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: \"#fff\" },
  knobOn: { transform: [{ translateX: 22 }] },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: \"center\", justifyContent: \"center\",
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.05)\",
  },
  langChip: {
    height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, alignItems: \"center\", justifyContent: \"center\",
  },
  langChipActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
});
"
