"import React, { useRef, useState } from \"react\";
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable } from \"react-native\";
import { useRouter } from \"expo-router\";
import { LinearGradient } from \"expo-linear-gradient\";
import { Ionicons } from \"@expo/vector-icons\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { GradientButton } from \"@/src/components/GradientButton\";
import { colors, font, gradients } from \"@/src/theme\";

const { width } = Dimensions.get(\"window\");

const slides = [
  {
    icon: \"shield-checkmark\" as const,
    title: \"Predict Before Panic\",
    desc: \"Our AI listens for stress, motion, and sound patterns and triggers help before you even reach for your phone.\",
    gradient: gradients.primary,
  },
  {
    icon: \"radio\" as const,
    title: \"Voice-Activated SOS\",
    desc: \"Wake words like 'Help me' or 'Save me' silently dispatch your live location to your guardians.\",
    gradient: gradients.cool,
  },
  {
    icon: \"location\" as const,
    title: \"Safest Route Home\",
    desc: \"Real-time crime heatmaps, safest routes, and one-tap fake calls keep every walk under your control.\",
    gradient: gradients.success,
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const router = useRouter();

  const next = () => {
    if (index < slides.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.replace(\"/(auth)/login\");
    }
  };

  return (
    <View style={styles.root} testID=\"onboarding-screen\">
      <AnimatedBackground />
      <SafeAreaView style={styles.safe} edges={[\"top\", \"bottom\"]}>
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={() => router.replace(\"/(auth)/login\")} testID=\"onboarding-skip\">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={ref}
          data={slides}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
          renderItem={({ item }) => (
            <View style={{ width, paddingHorizontal: 24 }}>
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.iconGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon} size={72} color=\"#fff\" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          )}
        />

        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <GradientButton
            title={index < slides.length - 1 ? \"Continue\" : \"Get Started\"}
            onPress={next}
            testID=\"onboarding-continue\"
            icon={<Ionicons name=\"arrow-forward\" size={20} color=\"#fff\" />}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    padding: 20,
  },
  skip: { color: colors.textSecondary, ...font.bodyBold },
  iconWrap: {
    alignItems: \"center\",
    marginTop: 40,
    marginBottom: 40,
    shadowColor: colors.purple,
    shadowOpacity: 0.7,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  iconGrad: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  title: {
    ...font.h1,
    color: \"#fff\",
    textAlign: \"center\",
    fontSize: 34,
    marginBottom: 12,
  },
  desc: {
    color: colors.textSecondary,
    textAlign: \"center\",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: \"row\",
    justifyContent: \"center\",
    gap: 8,
    marginVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: \"rgba(255,255,255,0.2)\",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.cyan,
  },
  actions: { padding: 24 },
});
"
