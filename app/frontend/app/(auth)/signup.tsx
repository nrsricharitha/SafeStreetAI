"import React, { useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from \"react-native\";
import { useRouter, Link } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { TextField } from \"@/src/components/TextField\";
import { colors, font } from \"@/src/theme\";
import { useAuth } from \"@/src/auth-context\";
import { useToast } from \"@/src/components/Toast\";

export default function Signup() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(\"\");
  const [email, setEmail] = useState(\"\");
  const [phone, setPhone] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name || !email || !password) {
      toast(\"Fill all required fields\", \"warning\");
      return;
    }
    if (password.length < 6) {
      toast(\"Password must be 6+ characters\", \"warning\");
      return;
    }
    setBusy(true);
    try {
      await signUp(name.trim(), email.trim(), password, phone.trim() || undefined);
      toast(\"Account created!\", \"success\");
      router.replace(\"/(auth)/otp\");
    } catch (e: any) {
      toast(e.message || \"Signup failed\", \"error\");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"signup-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\", \"bottom\"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === \"ios\" ? \"padding\" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps=\"handled\"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.back}
              testID=\"signup-back\"
            >
              <Ionicons name=\"chevron-back\" size={22} color=\"#fff\" />
            </Pressable>
            <Text style={styles.title}>Create your shield</Text>
            <Text style={styles.sub}>Join thousands who feel safer every day</Text>

            <View style={{ marginTop: 30 }}>
              <TextField
                label=\"Full Name\"
                icon=\"person\"
                placeholder=\"Jane Doe\"
                value={name}
                onChangeText={setName}
                testID=\"signup-name-input\"
              />
              <TextField
                label=\"Email\"
                icon=\"mail\"
                placeholder=\"you@example.com\"
                autoCapitalize=\"none\"
                keyboardType=\"email-address\"
                value={email}
                onChangeText={setEmail}
                testID=\"signup-email-input\"
              />
              <TextField
                label=\"Phone (optional)\"
                icon=\"call\"
                placeholder=\"+1 555 0100\"
                keyboardType=\"phone-pad\"
                value={phone}
                onChangeText={setPhone}
                testID=\"signup-phone-input\"
              />
              <TextField
                label=\"Password\"
                icon=\"lock-closed\"
                placeholder=\"At least 6 characters\"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                testID=\"signup-password-input\"
              />

              <GradientButton
                title={busy ? \"Creating account…\" : \"Create Account\"}
                onPress={submit}
                disabled={busy}
                testID=\"signup-submit-button\"
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already registered? </Text>
                <Link href=\"/(auth)/login\" asChild>
                  <Pressable testID=\"signup-login-link\">
                    <Text style={styles.link}>Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
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
  link: { color: colors.cyan, fontWeight: \"600\" },
  footer: { flexDirection: \"row\", justifyContent: \"center\", marginTop: 20 },
  footerText: { color: colors.textSecondary },
});
"
