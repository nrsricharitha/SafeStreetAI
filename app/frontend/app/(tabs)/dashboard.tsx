"import React, { useCallback, useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from \"react-native\";
import { useRouter, useFocusEffect } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import * as Haptics from \"expo-haptics\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { colors, font, gradients, radius } from \"@/src/theme\";
import { useAuth } from \"@/src/auth-context\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Dash = {
  safety_score: number;
  contact_count: number;
  incidents_today: number;
  recent_incidents: any[];
  monitoring_active: boolean;
  active_session: any;
  unread_notifications: number;
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<Dash | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get<Dash>(\"/dashboard\");
      setData(d);
    } catch (e: any) {
      toast(e.message, \"error\");
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleMonitoring = async () => {
    if (Platform.OS !== \"web\") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (data?.monitoring_active && data.active_session) {
        await api.post(`/monitoring/stop/${data.active_session.id}`);
        toast(\"Monitoring stopped\", \"info\");
      } else {
        await api.post(\"/monitoring/start\");
        toast(\"Monitoring active — AI is on watch\", \"success\");
        router.push(\"/(tabs)/monitoring\");
      }
      load();
    } catch (e: any) {
      toast(e.message, \"error\");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const scoreColor =
    !data ? colors.cyan
    : data.safety_score >= 80 ? colors.green
    : data.safety_score >= 60 ? colors.amber
    : colors.orange;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"dashboard-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\"]}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor=\"#fff\" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Hi, {user?.name?.split(\" \")[0] || \"friend\"}</Text>
              <Text style={styles.sub}>Stay safe, we&apos;re watching over you.</Text>
            </View>
            <Pressable onPress={() => router.push(\"/notifications\")} style={styles.iconBtn} testID=\"dashboard-notifications\">
              <Ionicons name=\"notifications-outline\" size={22} color=\"#fff\" />
              {data && data.unread_notifications > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{data.unread_notifications}</Text></View>
              )}
            </Pressable>
          </View>

          {/* Safety score hero */}
          <GlassCard style={{ marginBottom: 16 }} glow={scoreColor}>
            <View style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Safety Score Today</Text>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>
                  {data?.safety_score ?? \"--\"}
                  <Text style={{ fontSize: 20, color: colors.textSecondary }}>/100</Text>
                </Text>
                <Text style={styles.scoreDesc}>
                  {(!data || data.safety_score >= 80) ? \"You're in a low-risk zone.\" : \"Elevated — stay aware.\"}
                </Text>
              </View>
              <View style={[styles.scoreOrb, { backgroundColor: scoreColor + \"22\", borderColor: scoreColor }]}>
                <Ionicons name=\"shield-checkmark\" size={44} color={scoreColor} />
              </View>
            </View>
          </GlassCard>

          {/* Monitoring toggle */}
          <Pressable onPress={toggleMonitoring} testID=\"dashboard-monitoring-toggle\">
            <LinearGradient
              colors={data?.monitoring_active ? gradients.success : gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.monitorCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.monitorLabel}>
                  {data?.monitoring_active ? \"MONITORING ACTIVE\" : \"AI PROTECTION\"}
                </Text>
                <Text style={styles.monitorTitle}>
                  {data?.monitoring_active ? \"Tap to stop\" : \"Tap to start monitoring\"}
                </Text>
                <Text style={styles.monitorSub}>
                  {data?.monitoring_active ? \"Audio, motion & threat scanner online\" : \"Predictive threat detection engine\"}
                </Text>
              </View>
              <View style={styles.playBtn}>
                <Ionicons name={data?.monitoring_active ? \"stop\" : \"play\"} size={26} color=\"#fff\" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Metric grid */}
          <View style={styles.grid}>
            <Metric icon=\"people\" label=\"Guardians\" value={String(data?.contact_count ?? 0)} onPress={() => router.push(\"/contacts\")} tint={colors.cyan} testID=\"metric-contacts\" />
            <Metric icon=\"warning\" label=\"Alerts today\" value={String(data?.incidents_today ?? 0)} onPress={() => router.push(\"/incidents\")} tint={colors.amber} testID=\"metric-incidents\" />
            <Metric icon=\"location\" label=\"GPS\" value=\"Live\" onPress={() => router.push(\"/location\")} tint={colors.green} testID=\"metric-gps\" />
            <Metric icon=\"battery-full\" label=\"Battery\" value=\"87%\" tint={colors.blue} testID=\"metric-battery\" />
          </View>

          {/* Quick actions */}
          <Text style={styles.section}>Quick actions</Text>
          <View style={styles.quickRow}>
            <QuickAction icon=\"map\" label=\"Safe Route\" onPress={() => router.push(\"/safe-route\")} testID=\"quick-safe-route\" />
            <QuickAction icon=\"flame\" label=\"Heatmap\" onPress={() => router.push(\"/heatmap\")} testID=\"quick-heatmap\" />
            <QuickAction icon=\"call\" label=\"Fake Call\" onPress={() => router.push(\"/fake-call\")} testID=\"quick-fake-call\" />
            <QuickAction icon=\"sparkles\" label=\"Aegis AI\" onPress={() => router.push(\"/chat\")} testID=\"quick-chat\" />
          </View>

          {/* Demo mode */}
          <GradientButton
            title=\"Start Judge Demo\"
            variant=\"warning\"
            icon={<Ionicons name=\"play-circle\" size={22} color=\"#fff\" />}
            onPress={() => router.push(\"/(tabs)/monitoring?demo=1\")}
            testID=\"dashboard-demo-button\"
            style={{ marginTop: 16 }}
          />

          {/* Recent incidents */}
          <Text style={styles.section}>Recent incidents</Text>
          {data && data.recent_incidents.length === 0 && (
            <GlassCard>
              <View style={{ alignItems: \"center\", padding: 12 }}>
                <Ionicons name=\"checkmark-circle\" size={44} color={colors.green} />
                <Text style={{ color: \"#fff\", marginTop: 12, ...font.h4 }}>All quiet</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4, textAlign: \"center\" }}>
                  No incidents logged. You&apos;re looking safe.
                </Text>
              </View>
            </GlassCard>
          )}
          {data?.recent_incidents.slice(0, 3).map((inc: any) => (
            <Pressable
              key={inc.id}
              onPress={() => router.push({ pathname: \"/incident/[id]\", params: { id: inc.id } })}
              testID={`recent-incident-${inc.id}`}
            >
              <GlassCard style={{ marginBottom: 10 }}>
                <View style={styles.incRow}>
                  <View style={[styles.incDot, { backgroundColor: colors.red + \"33\" }]}>
                    <Ionicons name=\"alert\" size={20} color={colors.red} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: \"#fff\", ...font.bodyBold }}>{inc.danger_level.toUpperCase()} alert</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {new Date(inc.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name=\"chevron-forward\" size={20} color={colors.textSecondary} />
                </View>
              </GlassCard>
            </Pressable>
          ))}

          <View style={styles.exploreRow}>
            <ExploreLink label=\"Incident History\" icon=\"time\" onPress={() => router.push(\"/incidents\")} />
            <ExploreLink label=\"Settings\" icon=\"settings\" onPress={() => router.push(\"/settings\")} />
            {user?.role === \"admin\" && (
              <ExploreLink label=\"Admin\" icon=\"stats-chart\" onPress={() => router.push(\"/admin\")} />
            )}
            <ExploreLink label=\"Logout\" icon=\"log-out\" onPress={() => { signOut(); router.replace(\"/(auth)/login\"); }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({ icon, label, value, tint, onPress, testID }: any) {
  return (
    <Pressable onPress={onPress} style={{ width: \"48%\" }} testID={testID}>
      <GlassCard style={{ padding: 16 }} padded={false}>
        <View style={{ padding: 14 }}>
          <View style={[styles.metricIcon, { backgroundColor: tint + \"22\" }]}>
            <Ionicons name={icon} size={18} color={tint} />
          </View>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricLabel}>{label}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress, testID }: any) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} testID={testID}>
      <View style={styles.quickCard}>
        <Ionicons name={icon} size={22} color={colors.cyan} />
        <Text style={styles.quickLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ExploreLink({ label, icon, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.exploreLink} testID={`explore-${label.toLowerCase().replace(/\s+/g,\"-\")}`}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={{ color: colors.textPrimary, ...font.bodyBold, flex: 1 }}>{label}</Text>
      <Ionicons name=\"chevron-forward\" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: \"row\", alignItems: \"center\", marginBottom: 20 },
  hello: { ...font.h2, color: \"#fff\" },
  sub: { color: colors.textSecondary, marginTop: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: \"center\", justifyContent: \"center\",
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  badge: {
    position: \"absolute\", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: colors.red, alignItems: \"center\", justifyContent: \"center\",
  },
  badgeText: { color: \"#fff\", fontSize: 10, fontWeight: \"700\" },
  label: { ...font.label, color: colors.textSecondary },
  scoreRow: { flexDirection: \"row\", alignItems: \"center\" },
  scoreValue: { fontSize: 54, fontWeight: \"800\", letterSpacing: -1, marginTop: 4 },
  scoreDesc: { color: colors.textSecondary, marginTop: 4 },
  scoreOrb: {
    width: 80, height: 80, borderRadius: 40, alignItems: \"center\", justifyContent: \"center\",
    borderWidth: 1,
  },
  monitorCard: {
    borderRadius: radius.lg, padding: 20, flexDirection: \"row\", alignItems: \"center\",
    marginBottom: 16, minHeight: 110,
  },
  monitorLabel: { color: \"rgba(255,255,255,0.8)\", fontSize: 11, fontWeight: \"700\", letterSpacing: 2 },
  monitorTitle: { color: \"#fff\", fontSize: 22, fontWeight: \"800\", marginTop: 4 },
  monitorSub: { color: \"rgba(255,255,255,0.8)\", marginTop: 4 },
  playBtn: {
    width: 60, height: 60, borderRadius: 30, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: \"rgba(0,0,0,0.25)\", borderWidth: 1, borderColor: \"rgba(255,255,255,0.25)\",
  },
  grid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 12 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: \"center\", justifyContent: \"center\", marginBottom: 10 },
  metricValue: { color: \"#fff\", fontSize: 24, fontWeight: \"800\" },
  metricLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  section: { ...font.h4, color: \"#fff\", marginTop: 24, marginBottom: 12 },
  quickRow: { flexDirection: \"row\", gap: 10 },
  quickCard: {
    padding: 14, alignItems: \"center\", justifyContent: \"center\", gap: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.03)\", minHeight: 82,
  },
  quickLabel: { color: \"#fff\", fontSize: 12, fontWeight: \"600\" },
  incRow: { flexDirection: \"row\", alignItems: \"center\", gap: 12 },
  incDot: { width: 42, height: 42, borderRadius: 21, alignItems: \"center\", justifyContent: \"center\" },
  exploreRow: { marginTop: 20, gap: 8 },
  exploreLink: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12, padding: 14,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
});
"
