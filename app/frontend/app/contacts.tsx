"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, RefreshControl } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { useFocusEffect } from \"expo-router\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { BottomSheet } from \"@/src/components/BottomSheet\";
import { TextField } from \"@/src/components/TextField\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font, radius } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  primary: boolean;
};

const RELATIONSHIPS = [\"Family\", \"Friend\", \"Partner\", \"Colleague\", \"Other\"];

export default function Contacts() {
  const { toast } = useToast();
  const [list, setList] = useState<Contact[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState(\"\");
  const [phone, setPhone] = useState(\"\");
  const [email, setEmail] = useState(\"\");
  const [relationship, setRelationship] = useState(\"Family\");
  const [primary, setPrimary] = useState(false);

  const load = useCallback(async () => {
    try {
      const l = await api.get<Contact[]>(\"/contacts\");
      setList(l);
    } catch (e: any) { toast(e.message, \"error\"); }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reset = () => {
    setName(\"\"); setPhone(\"\"); setEmail(\"\"); setRelationship(\"Family\"); setPrimary(false); setEditing(null);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setName(c.name); setPhone(c.phone); setEmail(c.email || \"\");
    setRelationship(c.relationship || \"Family\"); setPrimary(c.primary);
    setShowAdd(true);
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return toast(\"Name and phone required\", \"warning\");
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, { name, phone, email, relationship, primary });
        toast(\"Contact updated\", \"success\");
      } else {
        await api.post(\"/contacts\", { name, phone, email, relationship, primary });
        toast(\"Contact added\", \"success\");
      }
      setShowAdd(false); reset(); load();
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  const remove = async (id: string) => {
    try {
      await api.del(`/contacts/${id}`);
      toast(\"Contact removed\", \"info\");
      load();
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"contacts-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 20 }} edges={[\"top\", \"bottom\"]}>
        <ScreenHeader
          title=\"Guardians\"
          subtitle={`${list.length} contact${list.length !== 1 ? \"s\" : \"\"}`}
          right={
            <Pressable onPress={() => { reset(); setShowAdd(true); }} style={styles.iconBtn} testID=\"contacts-add\">
              <Ionicons name=\"add\" size={22} color=\"#fff\" />
            </Pressable>
          }
        />

        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor=\"#fff\" />}
          ListEmptyComponent={
            <GlassCard>
              <View style={{ alignItems: \"center\", padding: 12 }}>
                <Ionicons name=\"people-outline\" size={44} color={colors.cyan} />
                <Text style={{ color: \"#fff\", ...font.h4, marginTop: 12 }}>No guardians yet</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 6, textAlign: \"center\" }}>
                  Add trusted contacts who will be alerted if SOS triggers.
                </Text>
                <GradientButton title=\"Add first guardian\" onPress={() => { reset(); setShowAdd(true); }} style={{ marginTop: 16 }} testID=\"contacts-empty-add\" />
                <Pressable onPress={() => toast(\"Phone import requires native permission\", \"info\")} style={styles.importBtn} testID=\"contacts-import\">
                  <Ionicons name=\"phone-portrait\" size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, ...font.small, fontWeight: \"600\" }}>Import from phone</Text>
                </Pressable>
              </View>
            </GlassCard>
          }
          renderItem={({ item }) => (
            <GlassCard style={{ marginBottom: 12 }} padded={false}>
              <View style={{ padding: 16, flexDirection: \"row\", alignItems: \"center\", gap: 12 }}>
                <View style={[styles.avatar, item.primary && { borderColor: colors.cyan, borderWidth: 2 }]}>
                  <Ionicons name=\"person\" size={20} color=\"#fff\" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: \"row\", alignItems: \"center\", gap: 8 }}>
                    <Text style={{ color: \"#fff\", ...font.bodyBold }}>{item.name}</Text>
                    {item.primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={{ color: colors.cyan, fontSize: 10, fontWeight: \"800\" }}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    {item.phone}  •  {item.relationship || \"Contact\"}
                  </Text>
                </View>
                <Pressable onPress={() => openEdit(item)} style={styles.rowBtn} testID={`contact-edit-${item.id}`}>
                  <Ionicons name=\"create-outline\" size={18} color=\"#fff\" />
                </Pressable>
                <Pressable onPress={() => remove(item.id)} style={[styles.rowBtn, { backgroundColor: colors.red + \"22\" }]} testID={`contact-delete-${item.id}`}>
                  <Ionicons name=\"trash-outline\" size={18} color={colors.red} />
                </Pressable>
              </View>
            </GlassCard>
          )}
        />

        <BottomSheet visible={showAdd} onClose={() => { setShowAdd(false); reset(); }} title={editing ? \"Edit contact\" : \"Add guardian\"}>
          <TextField label=\"Name\" icon=\"person\" value={name} onChangeText={setName} testID=\"contact-name\" />
          <TextField label=\"Phone\" icon=\"call\" value={phone} onChangeText={setPhone} keyboardType=\"phone-pad\" testID=\"contact-phone\" />
          <TextField label=\"Email\" icon=\"mail\" value={email} onChangeText={setEmail} autoCapitalize=\"none\" testID=\"contact-email\" />
          <Text style={{ color: colors.textSecondary, ...font.label, marginBottom: 8 }}>RELATIONSHIP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {RELATIONSHIPS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRelationship(r)}
                style={[styles.chip, relationship === r && styles.chipActive]}
                testID={`contact-rel-${r}`}
              >
                <Text style={{ color: relationship === r ? colors.cyan : colors.textSecondary, fontWeight: \"700\", fontSize: 12 }}>{r}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={() => setPrimary((v) => !v)} style={styles.primaryRow} testID=\"contact-primary\">
            <Ionicons name={primary ? \"checkbox\" : \"square-outline\"} size={22} color={primary ? colors.cyan : colors.textSecondary} />
            <Text style={{ color: \"#fff\", marginLeft: 10 }}>Set as primary guardian</Text>
          </Pressable>
          <GradientButton title={editing ? \"Save changes\" : \"Add guardian\"} onPress={submit} style={{ marginTop: 14 }} testID=\"contact-submit\" />
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: colors.cyan + \"22\", borderWidth: 1, borderColor: colors.borderActive,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.purple + \"44\",
    alignItems: \"center\", justifyContent: \"center\",
  },
  primaryBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    borderWidth: 1, borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\",
  },
  rowBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: \"center\", justifyContent: \"center\",
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.04)\",
  },
  importBtn: {
    marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, flexDirection: \"row\", alignItems: \"center\", gap: 6,
  },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1,
    borderColor: colors.border, alignItems: \"center\", justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  chipActive: { borderColor: colors.borderActive, backgroundColor: colors.cyan + \"18\" },
  primaryRow: { flexDirection: \"row\", alignItems: \"center\", marginTop: 14 },
});
"
