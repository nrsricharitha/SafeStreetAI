"import React from \"react\";
import { View, Text, StyleSheet, TextInput as RNTextInput, TextInputProps } from \"react-native\";
import { colors, radius, font } from \"@/src/theme\";
import { Ionicons } from \"@expo/vector-icons\";

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  right?: React.ReactNode;
  testID?: string;
};

export function TextField({ label, icon, error, right, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, error ? styles.boxError : null]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />}
        <RNTextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...rest}
        />
        {right}
      </View>
      {error && <Text style={styles.err}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { ...font.label, color: colors.textSecondary, marginBottom: 8 },
  box: {
    flexDirection: \"row\",
    alignItems: \"center\",
    backgroundColor: \"rgba(255,255,255,0.05)\",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  boxError: { borderColor: colors.red },
  input: { flex: 1, color: colors.textPrimary, ...font.body, fontSize: 15 },
  err: { color: colors.red, marginTop: 6, fontSize: 12 },
});
"
