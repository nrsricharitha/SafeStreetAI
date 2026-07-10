"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useFocusEffect } from \"expo-router\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font, radius } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

const CATS = [\"all\", \"emergency\", \"monitoring\", \"community\", \"location\", \"battery\", \"system\"] as const;

type N = {
  id: string; title: string; body: string; category: string; read: boolean; created_at: string;
};

const catIcon = (c: string): keyof typeof Ionicons.glyphMap => {
  switch (c) {
    case \"emergency\": return \"alert\";
    case \"monitoring\": return \"radio\";
    case \"community\": return \"people\";
    case \"location\": return \"location\";
    case \"battery\": return \"battery-half\";
    default: return \"information-circle\";
  }
};
const catColor = (c: string) =>
  c === \"emergency\" ? colors.red : c === \"monitoring\" ? colors.cyan
  : c === \"community\" ? colors.purple : c === \"location\" ? colors.green
  : c === \"battery\" ? colors.amber : colors.blue;

export default function Notifications() {
  const { toast } = useToast();
  const [list, setList] = useState<N[]>([]);
  const [cat, setCat] = useState<string>(\"all\");

  const load = useCallback(async () => {
    try { setList(await api.get<N[]>(\"/notifications\")); }
    catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = async (n: N) => {
    setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try { await api.put(`/notifications/${n.id}/read`); } catch { /* ignore */ }
  };

  const markAll = async () => {
    setList((p) => p.map((x) => ({ ...x, read: true })));
    try { await api.put(\"/notifications/read-all\"); toast(\"All marked as read\", \"info\"); }
    catch (e: any) { toast(e.message, \"error\"); }
  };

  const remove = async (n: N) => {
    setList((p) => p.filter((x) => x.id !== n.id));
    try { await api.del(`/notifications/${n.id}`); } catch { /* ignore */ }
  };

  const filtered = cat === \"all\" ? list : list.filter((n) => n.category === cat);
  const unread = list.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"notifications-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScreenHeader
          title=\"Notifications\"
          subtitle={`${unread} unread`}
          right={
            <Pressable onPress={markAll} testID=\"notifications-mark-all\">
              <Text style={{ color: colors.cyan, fontWeight: \"700\" }}>Mark all</Text>
            </Pressable>
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {CATS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              style={[styles.chip, cat === c && styles.chipActive, { flexShrink: 0 }]}
              testID={`notification-chip-${c}`}
            >
              <Text style={{ color: cat === c ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>
                {c.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <GlassCard>
              <View style={{ alignItems: \"center\", padding: 12 }}>
                <Ionicons name=\"notifications-off\" size={44} color={colors.cyan} />
                <Text style={{ color: \"#fff\", ...font.h4, marginTop: 12 }}>You&apos;re all caught up</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 6, textAlign: \"center\" }}>
                  No notifications in this category.
                </Text>
              </View>
            </GlassCard>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => markRead(item)}
              onLongPress={() => remove(item)}
              testID={`notification-${item.id}`}
            >
              <GlassCard style={{ marginBottom: 10, opacity: item.read ? 0.7 : 1 }}>
                <View style={{ flexDirection: \"row\", gap: 12, alignItems: \"flex-start\" }}>
                  <View style={[styles.icon, { backgroundColor: catColor(item.category) + \"22\" }]}>
                    <Ionicons name={catIcon(item.category)} size={18} color={catColor(item.category)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 6 }}>
                      <Text style={{ color: \"#fff\", ...font.bodyBold, flex: 1 }}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.body}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
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
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  chipActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: \"center\", justifyContent: \"center\" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cyan },
});
"
