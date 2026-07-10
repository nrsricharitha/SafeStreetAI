"import React from \"react\";
import Svg, { Circle, Defs, LinearGradient, Stop } from \"react-native-svg\";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from \"react-native-reanimated\";
import { View, Text, StyleSheet } from \"react-native\";
import { colors, dangerColor, DangerLevel, font } from \"@/src/theme\";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { value: number; level: DangerLevel; size?: number };

export function ThreatMeter({ value, level, size = 200 }: Props) {
  const stroke = 14;
  const radius = size / 2 - stroke;
  const c = size / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 500 });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const color = dangerColor(level);

  return (
    <View style={{ width: size, height: size, alignItems: \"center\", justifyContent: \"center\" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: \"-90deg\" }] }}>
        <Defs>
          <LinearGradient id=\"tm\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
            <Stop offset=\"0%\" stopColor={color} stopOpacity={1} />
            <Stop offset=\"100%\" stopColor=\"#fff\" stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={c}
          cy={c}
          r={radius}
          stroke=\"rgba(255,255,255,0.08)\"
          strokeWidth={stroke}
          fill=\"none\"
        />
        <AnimatedCircle
          cx={c}
          cy={c}
          r={radius}
          stroke=\"url(#tm)\"
          strokeWidth={stroke}
          strokeLinecap=\"round\"
          strokeDasharray={circumference}
          fill=\"none\"
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color }]} testID=\"threat-value\">
          {Math.round(value * 100)}
        </Text>
        <Text style={styles.label}>THREAT</Text>
        <Text style={[styles.level, { color }]}>{level.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: \"absolute\",
    alignItems: \"center\",
  },
  value: {
    fontSize: 52,
    fontWeight: \"800\",
    letterSpacing: -1,
  },
  label: {
    ...font.label,
    color: colors.textSecondary,
  },
  level: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: \"700\",
    letterSpacing: 3,
  },
});
"
