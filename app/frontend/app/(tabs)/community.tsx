"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput, RefreshControl, ScrollView } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useFocusEffect } from \"expo-router\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { BottomSheet } from \"@/src/components/BottomSheet\";
import { TextField } from \"@/src/components/TextField\";
import { colors, font, radius } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";
import { useAuth } from \"@/src/auth-context\";

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  area?: string;
  photo?: string;
  author_name: string;
  author_photo?: string;
  verified: boolean;
  likes: string[];
  comments: any[];
  created_at: string;
};

const CATEGORIES = [\"all\", \"harassment\", \"theft\", \"lighting\", \"other\"];
const PLACEHOLDER_PHOTOS = [
  \"https://images.unsplash.com/photo-1586165877141-3dbcfc059283?w=800\",
  \"https://images.unsplash.com/photo-1453413453658-27fec8f43f29?w=800\",
];

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState(\"all\");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState(\"\");
  const [desc, setDesc] = useState(\"\");
  const [area, setArea] = useState(\"\");
  const [selCat, setSelCat] = useState(\"harassment\");
  const [anonymous, setAnonymous] = useState(false);
  const [selectedForComments, setSelectedForComments] = useState<Report | null>(null);
  const [commentText, setCommentText] = useState(\"\");

  const load = useCallback(async () => {
    try {
      const list = await api.get<Report[]>(\"/reports\");
      setReports(list);
    } catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!title.trim() || !desc.trim()) return toast(\"Title & description required\", \"warning\");
    try {
      await api.post(\"/reports\", {
        title, description: desc, category: selCat, area,
        anonymous, photo: PLACEHOLDER_PHOTOS[Math.floor(Math.random() * PLACEHOLDER_PHOTOS.length)],
      });
      toast(\"Report submitted\", \"success\");
      setShowAdd(false);
      setTitle(\"\"); setDesc(\"\"); setArea(\"\"); setAnonymous(false);
      load();
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  const toggleLike = async (r: Report) => {
    try {
      const res = await api.post<any>(`/reports/${r.id}/like`);
      setReports((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? { ...x, likes: res.liked ? [...x.likes, user!.id] : x.likes.filter((i) => i !== user!.id) }
            : x
        )
      );
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  const sendComment = async () => {
    if (!selectedForComments || !commentText.trim()) return;
    try {
      const c = await api.post<any>(`/reports/${selectedForComments.id}/comment`, { text: commentText });
      setSelectedForComments({
        ...selectedForComments,
        comments: [...selectedForComments.comments, c],
      });
      setReports((prev) =>
        prev.map((r) => (r.id === selectedForComments.id ? { ...r, comments: [...r.comments, c] } : r))
      );
      setCommentText(\"\");
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  const filtered = category === \"all\" ? reports : reports.filter((r) => r.category === category);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"community-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\"]}>
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Community</Text>
              <Text style={styles.title}>Neighborhood Watch</Text>
            </View>
            <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn} testID=\"community-add\">
              <Ionicons name=\"add\" size={26} color=\"#fff\" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 0, paddingBottom: 12 }}
          >
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, active && styles.chipActive, { flexShrink: 0 }]}
                  testID={`community-chip-${c}`}
                >
                  <Text style={{ color: active ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>
                    {c.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 140, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor=\"#fff\" />}
          ListEmptyComponent={
            <GlassCard>
              <View style={{ alignItems: \"center\", padding: 12 }}>
                <Ionicons name=\"megaphone-outline\" size={44} color={colors.cyan} />
                <Text style={{ color: \"#fff\", ...font.h4, marginTop: 12 }}>No reports yet</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 6, textAlign: \"center\" }}>
                  Share an unsafe spot to help others in your area.
                </Text>
                <GradientButton title=\"Report an area\" onPress={() => setShowAdd(true)} style={{ marginTop: 16 }} testID=\"community-empty-add\" />
              </View>
            </GlassCard>
          }
          renderItem={({ item }) => (
            <GlassCard style={{ marginBottom: 14 }} padded={false} testID={`report-${item.id}`}>
              {item.photo && (
                <Image source={{ uri: item.photo }} style={styles.photo} />
              )}
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 10, marginBottom: 10 }}>
                  <View style={styles.avatar}>
                    <Ionicons name=\"person\" size={16} color=\"#fff\" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: \"#fff\", fontWeight: \"700\" }}>{item.author_name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                  {item.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name=\"checkmark-circle\" size={14} color={colors.green} />
                      <Text style={{ color: colors.green, fontSize: 11, fontWeight: \"700\" }}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: \"#fff\", ...font.h4 }}>{item.title}</Text>
                {item.area && <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 12 }}>📍 {item.area}</Text>}
                <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>{item.description}</Text>
                <View style={styles.actionsRow}>
                  <Pressable onPress={() => toggleLike(item)} style={styles.action} testID={`report-like-${item.id}`}>
                    <Ionicons
                      name={user && item.likes.includes(user.id) ? \"heart\" : \"heart-outline\"}
                      size={20}
                      color={user && item.likes.includes(user.id) ? colors.red : colors.textSecondary}
                    />
                    <Text style={styles.actionText}>{item.likes.length}</Text>
                  </Pressable>
                  <Pressable onPress={() => setSelectedForComments(item)} style={styles.action} testID={`report-comment-${item.id}`}>
                    <Ionicons name=\"chatbubble-outline\" size={18} color={colors.textSecondary} />
                    <Text style={styles.actionText}>{item.comments.length}</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.tag}>{item.category.toUpperCase()}</Text>
                </View>
              </View>
            </GlassCard>
          )}
        />

        {/* Add report sheet */}
        <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title=\"Report unsafe area\">
          <TextField label=\"Title\" placeholder=\"Poor lighting at MG road\" value={title} onChangeText={setTitle} testID=\"report-title\" />
          <TextField label=\"Area\" placeholder=\"Location or landmark\" value={area} onChangeText={setArea} testID=\"report-area\" />
          <TextField label=\"Description\" placeholder=\"Describe what happened…\" value={desc} onChangeText={setDesc} multiline testID=\"report-desc\" />
          <Text style={{ color: colors.textSecondary, ...font.label, marginBottom: 8 }}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.filter((c) => c !== \"all\").map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelCat(c)}
                style={[styles.chip, selCat === c && styles.chipActive]}
                testID={`report-cat-${c}`}
              >
                <Text style={{ color: selCat === c ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>
                  {c.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={() => setAnonymous((v) => !v)} style={styles.anonRow} testID=\"report-anon\">
            <Ionicons name={anonymous ? \"checkbox\" : \"square-outline\"} size={22} color={anonymous ? colors.cyan : colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, marginLeft: 10 }}>Post anonymously</Text>
          </Pressable>
          <GradientButton title=\"Submit report\" onPress={submit} testID=\"report-submit\" style={{ marginTop: 14 }} />
        </BottomSheet>

        {/* Comments sheet */}
        <BottomSheet visible={!!selectedForComments} onClose={() => setSelectedForComments(null)} title=\"Comments\">
          <ScrollView style={{ maxHeight: 260 }}>
            {selectedForComments?.comments.length === 0 && (
              <Text style={{ color: colors.textMuted, textAlign: \"center\", padding: 20 }}>Be the first to comment.</Text>
            )}
            {selectedForComments?.comments.map((c: any, i: number) => (
              <View key={i} style={styles.commentRow}>
                <View style={styles.avatar}><Ionicons name=\"person\" size={14} color=\"#fff\" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: \"#fff\", fontWeight: \"700\", fontSize: 13 }}>{c.author}</Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{c.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.commentInputRow}>
            <TextInput
              placeholder=\"Add a comment…\"
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              testID=\"comment-input\"
            />
            <Pressable onPress={sendComment} style={styles.sendBtn} testID=\"comment-send\">
              <Ionicons name=\"send\" size={18} color=\"#fff\" />
            </Pressable>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: \"row\", alignItems: \"center\", marginBottom: 16 },
  eyebrow: { ...font.label, color: colors.textSecondary },
  title: { ...font.h2, color: \"#fff\", marginTop: 4 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: colors.cyan + \"22\", borderWidth: 1, borderColor: colors.borderActive,
  },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  chipActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
  photo: { width: \"100%\", height: 160 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.purple + \"44\",
    alignItems: \"center\", justifyContent: \"center\",
  },
  actionsRow: { flexDirection: \"row\", alignItems: \"center\", gap: 20, marginTop: 12 },
  action: { flexDirection: \"row\", alignItems: \"center\", gap: 6 },
  actionText: { color: colors.textSecondary, fontWeight: \"700\", fontSize: 13 },
  tag: {
    color: colors.textSecondary, fontSize: 10, fontWeight: \"700\",
    letterSpacing: 1.5, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  verifiedBadge: { flexDirection: \"row\", gap: 4, alignItems: \"center\" },
  anonRow: { flexDirection: \"row\", alignItems: \"center\", marginTop: 14 },
  commentRow: { flexDirection: \"row\", gap: 10, alignItems: \"flex-start\", marginVertical: 8 },
  commentInputRow: { flexDirection: \"row\", alignItems: \"center\", gap: 10, marginTop: 14 },
  commentInput: {
    flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.05)\", paddingHorizontal: 16, color: \"#fff\",
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: colors.cyan,
  },
  verifiedBadgeSpace: {},
});
"
