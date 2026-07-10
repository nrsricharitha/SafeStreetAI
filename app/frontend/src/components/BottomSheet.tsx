"import React from \"react\";
import { Modal, View, Text, StyleSheet, Pressable } from \"react-native\";
import { BlurView } from \"expo-blur\";
import Animated, { FadeIn, SlideInDown } from \"react-native-reanimated\";
import { colors, font, radius } from \"@/src/theme\";
import { Ionicons } from \"@expo/vector-icons\";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, title, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType=\"none\" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={30} tint=\"dark\" style={StyleSheet.absoluteFill} />
          <View style={styles.dim} />
        </Pressable>
        <Animated.View
          entering={SlideInDown.duration(280).springify().damping(18)}
          style={styles.sheet}
        >
          <View style={styles.grabber} />
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} testID=\"bottom-sheet-close\">
                <Ionicons name=\"close\" size={26} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: \"rgba(0,0,0,0.45)\" },
  sheet: {
    position: \"absolute\",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: \"#0d0d18\",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: \"center\",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: \"rgba(255,255,255,0.15)\",
    marginBottom: 14,
  },
  header: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    marginBottom: 14,
  },
  title: { ...font.h3, color: colors.textPrimary },
});
"
