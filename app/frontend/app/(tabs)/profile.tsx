"import React, { useCallback, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from \"react-native\";
import { useRouter, useFocusEffect } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GlassCard } from \"@/src/components/GlassCard\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { TextField } from \"@/src/components/TextField\";
import { BottomSheet } from \"@/src/components/BottomSheet\";
import { colors, font, radius } from \"@/src/theme\";
import { useAuth } from \"@/src/auth-context\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

export default function Profile() {
  const { user, signOut, refresh } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || \"\");
  const [phone, setPhone] = useState(user?.phone || \"\");
  const [blood, setBlood] = useState(user?.blood_group || \"\");
  const [medical, setMedical] = useState(user?.medical_info || \"\");
  const [address, setAddress] = useState(user?.address || \"\");

  useFocusEffect(useCallback(() => {
    if (user) {
      setName(user.name); setPhone(user.phone || \"\");
      setBlood(user.blood_group || \"\"); setMedical(user.medical_info || \"\");
      setAddress(user.address || \"\");
    }
  }, [user]));

  const save = async () => {
    try {
      await api.put(\"/profile\", { name, phone, blood_group: blood, medical_info: medical, address });
      await refresh();
      toast(\"Profile updated\", \"success\");
      setEditing(false);
    } catch (e: any) { toast(e.message, \"error\"); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"profile-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\"]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={{ ...font.h2, color: \"#fff\" }}>Profile</Text>
            <Pressable onPress={() => setEditing(true)} style={styles.iconBtn} testID=\"profile-edit\">
              <Ionicons name=\"create-outline\" size={20} color=\"#fff\" />
            </Pressable>
          </View>

          <GlassCard style={{ alignItems: \"center\", paddingVertical: 30 }} glow={colors.cyan}>
            <View style={styles.avatar}>
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={{ width: \"100%\", height: \"100%\", borderRadius: 60 }} />
              ) : (
                <Ionicons name=\"person\" size={54} color=\"#fff\" />
              )}
            </View>
            <Text style={{ ...font.h3, color: \"#fff\", marginTop: 14 }}>{user?.name}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>
            {user?.role === \"admin\" && (
              <View style={styles.adminBadge}>
                <Ionicons name=\"star\" size={12} color={colors.amber} />
                <Text style={{ color: colors.amber, fontSize: 11, fontWeight: \"700\", letterSpacing: 1 }}>ADMIN</Text>
              </View>
            )}
          </GlassCard>

          <Text style={styles.section}>Emergency Info</Text>
          <GlassCard>
            <Row icon=\"call\" label=\"Phone\" value={user?.phone || \"—\"} />
            <Row icon=\"water\" label=\"Blood Group\" value={user?.blood_group || \"—\"} />
            <Row icon=\"medkit\" label=\"Medical Info\" value={user?.medical_info || \"—\"} />
            <Row icon=\"home\" label=\"Home Address\" value={user?.address || \"—\"} last />
          </GlassCard>

          <Text style={styles.section}>Explore</Text>
          <View style={{ gap: 10 }}>
            <Nav icon=\"people\" label=\"Emergency Contacts\" onPress={() => router.push(\"/contacts\")} testID=\"profile-nav-contacts\" />
            <Nav icon=\"time\" label=\"Incident History\" onPress={() => router.push(\"/incidents\")} testID=\"profile-nav-incidents\" />
            <Nav icon=\"settings\" label=\"Settings\" onPress={() => router.push(\"/settings\")} testID=\"profile-nav-settings\" />
            <Nav icon=\"chatbubbles\" label=\"Aegis AI Chat\" onPress={() => router.push(\"/chat\")} testID=\"profile-nav-chat\" />
            <Nav icon=\"notifications\" label=\"Notifications\" onPress={() => router.push(\"/notifications\")} testID=\"profile-nav-notifications\" />
            {user?.role === \"admin\" && (
              <Nav icon=\"stats-chart\" label=\"Admin Dashboard\" onPress={() => router.push(\"/admin\")} testID=\"profile-nav-admin\" />
            )}
          </View>

          <GradientButton
            title=\"Sign Out\"
            variant=\"ghost\"
            icon={<Ionicons name=\"log-out-outline\" size={20} color=\"#fff\" />}
            onPress={async () => { await signOut(); router.replace(\"/(auth)/login\"); }}
            testID=\"profile-signout\"
            style={{ marginTop: 20 }}
          />
          <Text style={{ color: colors.textMuted, textAlign: \"center\", marginTop: 16, fontSize: 12 }}>
            SafeStreet AI · v1.0
          </Text>
        </ScrollView>

        <BottomSheet visible={editing} onClose={() => setEditing(false)} title=\"Edit Profile\">
          <TextField label=\"Name\" icon=\"person\" value={name} onChangeText={setName} testID=\"edit-name\" />
          <TextField label=\"Phone\" icon=\"call\" value={phone} onChangeText={setPhone} keyboardType=\"phone-pad\" testID=\"edit-phone\" />
          <TextField label=\"Blood Group\" icon=\"water\" value={blood} onChangeText={setBlood} testID=\"edit-blood\" />
          <TextField label=\"Medical Info\" icon=\"medkit\" value={medical} onChangeText={setMedical} multiline testID=\"edit-medical\" />
          <TextField label=\"Address\" icon=\"home\" value={address} onChangeText={setAddress} testID=\"edit-address\" />
          <GradientButton title=\"Save changes\" onPress={save} testID=\"edit-save\" />
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

function Row({ icon, label, value, last }: any) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={{ color: colors.textSecondary, ...font.body, width: 120 }}>{label}</Text>
      <Text style={{ color: \"#fff\", flex: 1 }} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function Nav({ icon, label, onPress, testID }: any) {
  return (
    <Pressable onPress={onPress} style={styles.nav} testID={testID}>
      <View style={styles.navIcon}><Ionicons name={icon} size={18} color={colors.cyan} /></View>
      <Text style={{ color: \"#fff\", ...font.bodyBold, flex: 1 }}>{label}</Text>
      <Ionicons name=\"chevron-forward\" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: \"row\", alignItems: \"center\", justifyContent: \"space-between\", marginBottom: 20 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: \"center\", justifyContent: \"center\",
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.purple + \"55\", borderWidth: 3, borderColor: colors.cyan,
    alignItems: \"center\", justifyContent: \"center\", overflow: \"hidden\",
  },
  adminBadge: {
    flexDirection: \"row\", gap: 6, alignItems: \"center\", marginTop: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
    borderColor: colors.amber, backgroundColor: colors.amber + \"18\",
  },
  section: { ...font.h4, color: \"#fff\", marginTop: 24, marginBottom: 12 },
  row: { flexDirection: \"row\", alignItems: \"center\", gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  nav: {
    flexDirection: \"row\", alignItems: \"center\", gap: 12, padding: 14,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  navIcon: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: colors.cyan + \"18\",
    alignItems: \"center\", justifyContent: \"center\",
  },
});
"
