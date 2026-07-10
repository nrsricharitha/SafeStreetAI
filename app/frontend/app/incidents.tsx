"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ScrollView } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter, useFocusEffect } from \"expo-router\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, dangerColor, DangerLevel, font, radius } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Incident = {
  id: string;
  threat_score: number;
  danger_level: DangerLevel;
  trigger: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  address?: string;
};

const FILTERS = [\"all\", \"critical\", \"high\", \"medium\", \"low\"];

export default function Incidents() {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<Incident[]>([]);
  const [q, setQ] = useState(\"\");
  const [filter, setFilter] = useState(\"all\");

  const load = useCallback(async () => {
    try {
      setList(await api.get<Incident[]>(\"/incidents\"));
    } catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = list.filter(
    (i) =>
      (filter === \"all\" || i.danger_level === filter) &&
      (q === \"\" ||
        i.trigger.toLowerCase().includes(q.toLowerCase()) ||
        (i.address || \"\").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"incidents-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScreenHeader title=\"Incident History\" subtitle={`${list.length} total`} />

        <View style={styles.searchBox}>
          <Ionicons name=\"search\" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder=\"Search incidents…\"
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            testID=\"incident-search\"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipActive, { flexShrink: 0 }]}
              testID={`incident-filter-${f}`}
            >
              <Text style={{ color: filter === f ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>
                {f.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <GlassCard>
              <View style={{ alignItems: \"center\", padding: 12 }}>
                <Ionicons name=\"checkmark-circle\" size={44} color={colors.green} />
                <Text style={{ color: \"#fff\", ...font.h4, marginTop: 12 }}>
                  {list.length === 0 ? \"No incidents yet\" : \"Nothing matches\"}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: 6, textAlign: \"center\" }}>
                  {list.length === 0 ? \"You're safe. All-clear.\" : \"Try changing the filter or search.\"}
                </Text>
              </View>
            </GlassCard>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: \"/incident/[id]\", params: { id: item.id } })}
              testID={`incident-${item.id}`}
            >
              <GlassCard style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                  <View style={[styles.icon, { backgroundColor: dangerColor(item.danger_level) + \"22\" }]}>
                    <Ionicons name=\"alert\" size={20} color={dangerColor(item.danger_level)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: \"#fff\", ...font.bodyBold }}>
                      {item.danger_level.toUpperCase()} • {item.trigger}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {item.address || \"No location\"}
                    </Text>
                  </View>
                  <View style={{ alignItems: \"flex-end\" }}>
                    <Text style={{ color: dangerColor(item.danger_level), fontWeight: \"800\", fontSize: 18 }}>
                      {Math.round(item.threat_score * 100)}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: \"700\", letterSpacing: 1 }}>THREAT</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: \"row\", alignItems: \"center\", gap: 10,
    borderRadius: radius.md, backgroundColor: \"rgba(255,255,255,0.05)\",
    paddingHorizontal: 14, height: 48, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: \"#fff\", fontSize: 14 },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  chipActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: \"center\", justifyContent: \"center\" },
});
"
