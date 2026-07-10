"import React from \"react\";
import { View, Text, Pressable, StyleSheet } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { useRouter } from \"expo-router\";
import { colors, font } from \"@/src/theme\";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, right, onBack }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (onBack ? onBack() : router.back())}
        style={styles.back}
        testID=\"header-back\"
      >
        <Ionicons name=\"chevron-back\" size={22} color={colors.textPrimary} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 12,
    marginBottom: 20,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: \"center\",
    justifyContent: \"center\",
    backgroundColor: \"rgba(255,255,255,0.05)\",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...font.h2, color: colors.textPrimary },
  sub: { ...font.small, color: colors.textSecondary, marginTop: 2 },
});
"
