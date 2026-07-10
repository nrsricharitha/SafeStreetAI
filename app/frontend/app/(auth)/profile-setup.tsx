"import React, { useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from \"react-native\";
import { useRouter } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { TextField } from \"@/src/components/TextField\";
import { colors, font } from \"@/src/theme\";
import { useAuth } from \"@/src/auth-context\";
import { useToast } from \"@/src/components/Toast\";
import { api } from \"@/src/api\";

export default function ProfileSetup() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(user?.phone ?? \"\");
  const [blood, setBlood] = useState(\"\");
  const [medical, setMedical] = useState(\"\");
  const [address, setAddress] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.put(\"/profile\", {
        phone,
        blood_group: blood,
        medical_info: medical,
        address,
      });
      await refresh();
      toast(\"Profile saved\", \"success\");
      router.replace(\"/(tabs)/dashboard\");
    } catch (e: any) {
      toast(e.message, \"error\");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"profile-setup-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\", \"bottom\"]}>
        <KeyboardAvoidingView behavior={Platform.OS === \"ios\" ? \"padding\" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.iconRow}>
              <View style={styles.icon}><Ionicons name=\"person-circle\" size={40} color={colors.cyan} /></View>
            </View>
            <Text style={styles.title}>Complete your shield</Text>
            <Text style={styles.sub}>Details help responders act faster in emergencies.</Text>
            <View style={{ marginTop: 30 }}>
              <TextField label=\"Phone\" icon=\"call\" value={phone} onChangeText={setPhone} keyboardType=\"phone-pad\" testID=\"setup-phone\" />
              <TextField label=\"Blood Group\" icon=\"water\" placeholder=\"e.g. O+\" value={blood} onChangeText={setBlood} testID=\"setup-blood\" />
              <TextField label=\"Medical Info\" icon=\"medkit\" placeholder=\"Allergies, conditions...\" value={medical} onChangeText={setMedical} multiline testID=\"setup-medical\" />
              <TextField label=\"Home Address\" icon=\"home\" placeholder=\"Street, city\" value={address} onChangeText={setAddress} testID=\"setup-address\" />
              <GradientButton
                title={busy ? \"Saving…\" : \"Activate Guardian\"}
                onPress={submit}
                disabled={busy}
                testID=\"setup-submit\"
              />
              <GradientButton
                title=\"Skip for now\"
                onPress={() => router.replace(\"/(tabs)/dashboard\")}
                variant=\"ghost\"
                style={{ marginTop: 12 }}
                testID=\"setup-skip\"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  iconRow: { alignItems: \"flex-start\", marginBottom: 20 },
  icon: {
    width: 58, height: 58, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, backgroundColor: \"rgba(0,229,255,0.08)\",
    alignItems: \"center\", justifyContent: \"center\",
  },
  title: { ...font.h1, color: \"#fff\", fontSize: 32 },
  sub: { ...font.body, color: colors.textSecondary, marginTop: 8 },
});
"
