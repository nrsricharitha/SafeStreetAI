"import React from \"react\";
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from \"react-native\";
import { BlurView } from \"expo-blur\";
import { LinearGradient } from \"expo-linear-gradient\";
import { colors, radius } from \"@/src/theme\";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padded?: boolean;
  glow?: string;
  testID?: string;
};

export function GlassCard({
  children,
  style,
  intensity = 30,
  padded = true,
  glow,
  testID,
}: Props) {
  const glowStyle = glow
    ? {
        shadowColor: glow,
        shadowOpacity: 0.5,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
      }
    : null;

  const content = (
    <>
      <LinearGradient
        colors={[\"rgba(255,255,255,0.06)\", \"rgba(255,255,255,0.02)\"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </>
  );

  if (Platform.OS === \"web\") {
    return (
      <View testID={testID} style={[styles.card, styles.webBg, glowStyle, style]}>
        {content}
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.card, glowStyle, style]}>
      <BlurView intensity={intensity} tint=\"dark\" style={StyleSheet.absoluteFill} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: \"hidden\",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  webBg: {
    backgroundColor: \"rgba(20, 20, 30, 0.75)\",
  },
  inner: {
    position: \"relative\",
  },
  padded: {
    padding: 20,
  },
});
"
