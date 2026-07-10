"import React from \"react\";
import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp } from \"react-native\";
import { LinearGradient } from \"expo-linear-gradient\";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from \"react-native-reanimated\";
import { colors, gradients, radius, shadow, font } from \"@/src/theme\";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress?: () => void;
  variant?: \"primary\" | \"danger\" | \"success\" | \"ghost\" | \"warning\";
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  testID?: string;
  size?: \"sm\" | \"md\" | \"lg\";
};

export function GradientButton({
  title,
  onPress,
  variant = \"primary\",
  icon,
  disabled,
  style,
  fullWidth = true,
  testID,
  size = \"md\",
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const grad =
    variant === \"danger\"
      ? gradients.danger
      : variant === \"success\"
      ? gradients.success
      : variant === \"warning\"
      ? gradients.warning
      : gradients.primary;

  const glowColor =
    variant === \"danger\"
      ? colors.red
      : variant === \"success\"
      ? colors.green
      : variant === \"warning\"
      ? colors.orange
      : colors.purple;

  const heightMap = { sm: 44, md: 52, lg: 60 };
  const height = heightMap[size];

  if (variant === \"ghost\") {
    return (
      <AnimatedPressable
        testID={testID}
        onPress={disabled ? undefined : onPress}
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[
          styles.ghost,
          { height, opacity: disabled ? 0.5 : 1, width: fullWidth ? \"100%\" : undefined },
          animStyle,
          style,
        ]}
      >
        {icon}
        <Text style={styles.ghostText}>{title}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[
        styles.wrap,
        shadow.glow(glowColor),
        { opacity: disabled ? 0.5 : 1, width: fullWidth ? \"100%\" : undefined },
        animStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.grad, { height }]}
      >
        <View style={styles.row}>
          {icon}
          <Text style={styles.text}>{title}</Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    overflow: \"hidden\",
  },
  grad: {
    alignItems: \"center\",
    justifyContent: \"center\",
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 10,
  },
  text: {
    ...font.bodyBold,
    color: \"#fff\",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ghost: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: \"center\",
    justifyContent: \"center\",
    flexDirection: \"row\",
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: \"rgba(255,255,255,0.03)\",
  },
  ghostText: {
    ...font.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
"
