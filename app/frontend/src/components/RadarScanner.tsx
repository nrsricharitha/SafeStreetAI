"import React, { useEffect } from \"react\";
import Svg, { Circle, Defs, RadialGradient, Stop, G } from \"react-native-svg\";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from \"react-native-reanimated\";
import { View } from \"react-native\";
import { colors } from \"@/src/theme\";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

type Props = { size?: number; color?: string; active?: boolean };

export function RadarScanner({ size = 220, color = colors.cyan, active = true }: Props) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rot.value = withRepeat(withTiming(360, { duration: 3500, easing: Easing.linear }), -1, false);
      pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      rot.value = 0;
      pulse.value = 0;
    }
  }, [active, rot, pulse]);

  const c = size / 2;
  const sweepProps = useAnimatedProps(() => ({
    // rotation only via transform on parent group
    originX: c,
    originY: c,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    transform: [{ rotate: `${rot.value}deg` }] as any,
  }));
  const ringProps = useAnimatedProps(() => ({
    r: 30 + pulse.value * (c - 40),
    opacity: 1 - pulse.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id=\"g1\" cx=\"50%\" cy=\"50%\" r=\"50%\">
            <Stop offset=\"0%\" stopColor={color} stopOpacity={0.35} />
            <Stop offset=\"100%\" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={c - 4} fill=\"url(#g1)\" />
        <Circle cx={c} cy={c} r={c - 4} stroke={color} strokeOpacity={0.15} strokeWidth={1} fill=\"none\" />
        <Circle cx={c} cy={c} r={(c - 4) * 0.7} stroke={color} strokeOpacity={0.12} strokeWidth={1} fill=\"none\" />
        <Circle cx={c} cy={c} r={(c - 4) * 0.4} stroke={color} strokeOpacity={0.1} strokeWidth={1} fill=\"none\" />
        <AnimatedCircle
          cx={c}
          cy={c}
          stroke={color}
          strokeWidth={2}
          fill=\"none\"
          animatedProps={ringProps}
        />
        <AnimatedG animatedProps={sweepProps}>
          <Circle cx={c + c / 2} cy={c} r={6} fill={color} opacity={0.9} />
          <Circle cx={c + c / 2 - 20} cy={c} r={4} fill={color} opacity={0.4} />
          <Circle cx={c + c / 2 - 40} cy={c} r={3} fill={color} opacity={0.2} />
        </AnimatedG>
        <Circle cx={c} cy={c} r={5} fill=\"#fff\" />
      </Svg>
    </View>
  );
}
"
