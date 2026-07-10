"import React, { useRef, useState } from \"react\";
import { View, Text, StyleSheet, TextInput, Pressable } from \"react-native\";
import { useRouter } from \"expo-router\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { colors, font, radius } from \"@/src/theme\";
import { useToast } from \"@/src/components/Toast\";
import { api } from \"@/src/api\";

export default function OTP() {
  const router = useRouter();
  const { toast } = useToast();
  const [digits, setDigits] = useState([\"\", \"\", \"\", \"\"]);
  const refs = useRef<Array<TextInput | null>>([]);
  const [busy, setBusy] = useState(false);

  const setD = (i: number, v: string) => {
    const clean = v.replace(/[^0-9]/g, \"\").slice(0, 1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 3) refs.current[i + 1]?.focus();
  };

  const submit = async () => {
    const code = digits.join(\"\");
    if (code.length < 4) return toast(\"Enter the 4-digit code\", \"warning\");
    setBusy(true);
    try {
      await api.post(\"/auth/verify-otp\", { code }, false);
      toast(\"Verified successfully\", \"success\");
      router.replace(\"/(auth)/profile-setup\");
    } catch (e: any) {
      toast(e.message || \"Invalid code\", \"error\");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"otp-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1, padding: 24 }} edges={[\"top\", \"bottom\"]}>
        <Pressable onPress={() => router.back()} style={styles.back} testID=\"otp-back\">
          <Ionicons name=\"chevron-back\" size={22} color=\"#fff\" />
        </Pressable>
        <Text style={styles.title}>Verify email</Text>
        <Text style={styles.sub}>
          We sent a 4-digit code to your inbox. Enter any code to simulate verification.
        </Text>
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => (refs.current[i] = r)}
              value={d}
              onChangeText={(v) => setD(i, v)}
              keyboardType=\"number-pad\"
              maxLength={1}
              style={styles.otpBox}
              testID={`otp-digit-${i}`}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === \"Backspace\" && !d && i > 0) refs.current[i - 1]?.focus();
              }}
            />
          ))}
        </View>
        <GradientButton
          title={busy ? \"Verifying…\" : \"Verify\"}
          onPress={submit}
          disabled={busy}
          testID=\"otp-submit-button\"
        />
        <Pressable style={{ alignSelf: \"center\", marginTop: 20 }} testID=\"otp-resend\">
          <Text style={{ color: colors.cyan, fontWeight: \"600\" }}>Resend code</Text>
        </Pressable>
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
  otpRow: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    marginVertical: 28,
    gap: 12,
  },
  otpBox: {
    flex: 1,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.05)\",
    textAlign: \"center\",
    color: \"#fff\",
    fontSize: 28,
    fontWeight: \"700\",
  },
});
"
