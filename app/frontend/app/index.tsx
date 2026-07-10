"import React, { useEffect } from \"react\";
import { View, Text, StyleSheet } from \"react-native\";
import { useRouter } from \"expo-router\";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from \"react-native-reanimated\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { colors, gradients, font } from \"@/src/theme\";
import { useAuth } from \"@/src/auth-context\";

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.14, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace(\"/(tabs)/dashboard\");
      else router.replace(\"/onboarding\");
    }, 1400);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.container} testID=\"splash-screen\">
      <AnimatedBackground />
      <Animated.View style={[styles.logoWrap, style]}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Ionicons name=\"shield-checkmark\" size={64} color=\"#fff\" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.brand}>SafeStreet AI</Text>
      <Text style={styles.tag}>Predictive safety. Zero-tap protection.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: \"center\", justifyContent: \"center\", backgroundColor: colors.bg },
  logoWrap: {
    shadowColor: colors.purple,
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 40,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  brand: {
    marginTop: 28,
    ...font.h1,
    color: \"#fff\",
    fontSize: 32,
    letterSpacing: -0.5,
  },
  tag: { marginTop: 8, ...font.body, color: colors.textSecondary },
});
"
