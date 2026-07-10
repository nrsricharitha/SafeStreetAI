"import React, { useState } from \"react\";
import { View, Text, StyleSheet, Pressable } from \"react-native\";
import { useRouter } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { TextField } from \"@/src/components/TextField\";
import { colors, font } from \"@/src/theme\";
import { useToast } from \"@/src/components/Toast\";
import { api } from \"@/src/api\";

export default function Forgot() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email) return toast(\"Enter email\", \"warning\");
    setBusy(true);
    try {
      await api.post(\"/auth/forgot-password\", { email: email.trim() }, false);
      toast(\"If that email exists, a reset link was sent\", \"success\");
      router.replace(\"/(auth)/login\");
    } catch (e: any) {
      toast(e.message || \"Request failed\", \"error\");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"forgot-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 24 }} edges={[\"top\", \"bottom\"]}>
        <Pressable onPress={() => router.back()} style={styles.back} testID=\"forgot-back\">
          <Ionicons name=\"chevron-back\" size={22} color=\"#fff\" />
        </Pressable>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          Enter your email and we&apos;ll send you a secure reset link.
        </Text>
        <View style={{ marginTop: 30 }}>
          <TextField
            label=\"Email\"
            icon=\"mail\"
            value={email}
            onChangeText={setEmail}
            autoCapitalize=\"none\"
            keyboardType=\"email-address\"
            testID=\"forgot-email-input\"
          />
          <GradientButton
            title={busy ? \"Sending…\" : \"Send Reset Link\"}
            onPress={submit}
            disabled={busy}
            testID=\"forgot-submit-button\"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: \"center\",
    justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.05)\",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  title: { ...font.h1, color: \"#fff\", fontSize: 32 },
  sub: { ...font.body, color: colors.textSecondary, marginTop: 8 },
});
"
