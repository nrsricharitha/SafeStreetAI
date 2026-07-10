"import React, { useEffect } from \"react\";
import { View, StyleSheet } from \"react-native\";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from \"react-native-reanimated\";
import { colors } from \"@/src/theme\";

const BAR_COUNT = 28;

function Bar({ index, intensity }: { index: number; intensity: number }) {
  const h = useSharedValue(6);
  useEffect(() => {
    const target = 10 + Math.abs(Math.sin(index * 0.5 + Date.now() / 1000)) * 40 * intensity;
    h.value = withRepeat(
      withTiming(target, { duration: 350 + (index % 5) * 90, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [index, intensity, h]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[styles.bar, style]} />;
}

export function Waveform({ intensity = 0.5 }: { intensity?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Bar key={i} index={i} intensity={intensity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    height: 60,
    gap: 3,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    opacity: 0.9,
  },
});
"
