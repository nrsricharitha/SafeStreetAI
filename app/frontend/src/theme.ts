"// Design tokens for SafeStreet AI — derived from /app/design_guidelines.json
import { Platform } from \"react-native\";

export const colors = {
  bg: \"#05050A\",
  bgSoft: \"#0B0B14\",
  card: \"rgba(25, 25, 35, 0.6)\",
  glass: \"rgba(255, 255, 255, 0.03)\",
  border: \"rgba(255, 255, 255, 0.08)\",
  borderActive: \"rgba(0, 229, 255, 0.35)\",
  purple: \"#B026FF\",
  blue: \"#2A84FF\",
  cyan: \"#00E5FF\",
  green: \"#00FF88\",
  amber: \"#FFB800\",
  orange: \"#FF6B00\",
  red: \"#FF2A2A\",
  redDeep: \"#800000\",
  textPrimary: \"#FFFFFF\",
  textSecondary: \"#A0A0B0\",
  textMuted: \"#64646E\",
  overlay: \"rgba(5, 5, 10, 0.85)\",
};

export const gradients = {
  primary: [\"#B026FF\", \"#2A84FF\", \"#00E5FF\"] as const,
  cool: [\"#2A84FF\", \"#00E5FF\"] as const,
  danger: [\"#FF2A2A\", \"#800000\"] as const,
  warning: [\"#FF6B00\", \"#FFB800\"] as const,
  success: [\"#00E5FF\", \"#00FF88\"] as const,
  glass: [\"rgba(255,255,255,0.06)\", \"rgba(255,255,255,0.02)\"] as const,
  dashboardTop: [\"#1a0a3a\", \"#050510\"] as const,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const font = {
  familyHeading: Platform.select({
    ios: \"System\",
    android: \"sans-serif-medium\",
    default: \"System\",
  })!,
  familyBody: Platform.select({
    ios: \"System\",
    android: \"sans-serif\",
    default: \"System\",
  })!,
  h1: { fontSize: 36, fontWeight: \"800\" as const, letterSpacing: -0.8 },
  h2: { fontSize: 28, fontWeight: \"700\" as const, letterSpacing: -0.5 },
  h3: { fontSize: 22, fontWeight: \"700\" as const, letterSpacing: -0.3 },
  h4: { fontSize: 18, fontWeight: \"600\" as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: \"400\" as const },
  bodyBold: { fontSize: 15, fontWeight: \"600\" as const },
  small: { fontSize: 13, fontWeight: \"400\" as const },
  label: {
    fontSize: 11,
    fontWeight: \"600\" as const,
    letterSpacing: 2,
    textTransform: \"uppercase\" as const,
  },
};

export const shadow = {
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  }),
  card: {
    shadowColor: \"#000\",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Danger level helpers ------------------------------------------------------
export type DangerLevel = \"safe\" | \"low\" | \"medium\" | \"high\" | \"critical\";

export function dangerColor(level: DangerLevel): string {
  switch (level) {
    case \"safe\":
      return colors.green;
    case \"low\":
      return colors.cyan;
    case \"medium\":
      return colors.amber;
    case \"high\":
      return colors.orange;
    case \"critical\":
      return colors.red;
  }
}

export function scoreToDanger(score: number): DangerLevel {
  if (score >= 0.85) return \"critical\";
  if (score >= 0.65) return \"high\";
  if (score >= 0.4) return \"medium\";
  if (score >= 0.2) return \"low\";
  return \"safe\";
}
"
