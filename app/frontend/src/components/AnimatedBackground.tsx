"import React from \"react\";
import { StyleSheet, View } from \"react-native\";
import { LinearGradient } from \"expo-linear-gradient\";
import { colors, gradients } from \"@/src/theme\";

export function AnimatedBackground() {
  return (
    <View pointerEvents=\"none\" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[\"#0a0520\", \"#050510\", \"#02020a\"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobBlue]} />
      <View style={[styles.blob, styles.blobCyan]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: \"absolute\",
    width: 360,
    height: 360,
    borderRadius: 999,
    opacity: 0.22,
  },
  blobPurple: {
    top: -100,
    left: -100,
    backgroundColor: colors.purple,
  },
  blobBlue: {
    top: 180,
    right: -140,
    backgroundColor: colors.blue,
  },
  blobCyan: {
    bottom: -120,
    left: 20,
    backgroundColor: colors.cyan,
  },
});
"
