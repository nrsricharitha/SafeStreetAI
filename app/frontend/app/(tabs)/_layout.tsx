"import React from \"react\";
import { View, Pressable, StyleSheet, Text, Platform } from \"react-native\";
import { Tabs, useRouter } from \"expo-router\";
import { BlurView } from \"expo-blur\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import * as Haptics from \"expo-haptics\";
import { useSafeAreaInsets } from \"react-native-safe-area-context\";
import { colors, gradients, shadow } from \"@/src/theme\";

type TabDef = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { name: \"dashboard\", label: \"Home\", icon: \"home\" },
  { name: \"monitoring\", label: \"AI Watch\", icon: \"radio\" },
  { name: \"community\", label: \"Community\", icon: \"people\" },
  { name: \"profile\", label: \"Profile\", icon: \"person\" },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSos = () => {
    if (Platform.OS !== \"web\") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push({ pathname: \"/sos\", params: { trigger: \"manual\" } });
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.barShadow}>
        {Platform.OS !== \"web\" && (
          <BlurView intensity={40} tint=\"dark\" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.bar}>
          {TABS.slice(0, 2).map((t, i) => (
            <TabItem key={t.name} tab={t} focused={state.index === i} onPress={() => navigation.navigate(t.name)} />
          ))}
          <View style={styles.sosSlot} />
          {TABS.slice(2).map((t, i) => (
            <TabItem
              key={t.name}
              tab={t}
              focused={state.index === i + 2}
              onPress={() => navigation.navigate(t.name)}
            />
          ))}
        </View>
      </View>
      <Pressable style={styles.sosBtn} onPress={handleSos} testID=\"sos-button\">
        <LinearGradient
          colors={gradients.danger}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sosGrad}
        >
          <Ionicons name=\"alert\" size={30} color=\"#fff\" />
          <Text style={styles.sosText}>SOS</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function TabItem({ tab, focused, onPress }: { tab: TabDef; focused: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.item} testID={`tab-${tab.name}`}>
      <Ionicons
        name={tab.icon}
        size={22}
        color={focused ? colors.cyan : colors.textSecondary}
      />
      <Text style={[styles.label, { color: focused ? colors.cyan : colors.textSecondary }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name=\"dashboard\" />
      <Tabs.Screen name=\"monitoring\" />
      <Tabs.Screen name=\"community\" />
      <Tabs.Screen name=\"profile\" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: \"absolute\",
    left: 12,
    right: 12,
    bottom: 0,
  },
  barShadow: {
    borderRadius: 28,
    overflow: \"hidden\",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: Platform.OS === \"web\" ? \"rgba(15,15,25,0.92)\" : \"rgba(20,20,30,0.55)\",
    ...shadow.card,
  },
  bar: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 74,
  },
  item: { flex: 1, alignItems: \"center\", justifyContent: \"center\", gap: 4 },
  label: { fontSize: 11, fontWeight: \"600\" },
  sosSlot: { width: 82 },
  sosBtn: {
    position: \"absolute\",
    top: -28,
    alignSelf: \"center\",
    left: 0,
    right: 0,
    alignItems: \"center\",
  },
  sosGrad: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: \"center\",
    justifyContent: \"center\",
    borderWidth: 3,
    borderColor: colors.bg,
    shadowColor: colors.red,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  sosText: { color: \"#fff\", fontSize: 10, fontWeight: \"800\", letterSpacing: 1.5 },
});
"
