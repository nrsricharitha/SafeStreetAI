"import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from \"react\";
import { StyleSheet, Text, View, Pressable, Platform } from \"react-native\";
import Animated, { FadeInUp, FadeOutUp } from \"react-native-reanimated\";
import { Ionicons } from \"@expo/vector-icons\";
import { colors, radius, font } from \"@/src/theme\";

type ToastType = \"info\" | \"success\" | \"error\" | \"warning\";
type ToastMsg = { id: string; type: ToastType; message: string };

type Ctx = { toast: (msg: string, type?: ToastType) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = \"info\") => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev, { id, type, message }]);
      const t = setTimeout(() => remove(id), 3200);
      timers.current.set(id, t);
    },
    [remove]
  );

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <View pointerEvents=\"box-none\" style={styles.container}>
        {items.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={[styles.toast, styles[t.type]]}
          >
            <Ionicons name={iconFor(t.type)} size={18} color=\"#fff\" />
            <Text style={styles.text}>{t.message}</Text>
            <Pressable onPress={() => remove(t.id)}>
              <Ionicons name=\"close\" size={16} color=\"rgba(255,255,255,0.8)\" />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

function iconFor(t: ToastType): keyof typeof Ionicons.glyphMap {
  if (t === \"success\") return \"checkmark-circle\";
  if (t === \"error\") return \"alert-circle\";
  if (t === \"warning\") return \"warning\";
  return \"information-circle\";
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error(\"useToast outside ToastProvider\");
  return c;
}

const styles = StyleSheet.create({
  container: {
    position: \"absolute\",
    top: Platform.OS === \"ios\" ? 60 : 40,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { flex: 1, color: \"#fff\", ...font.body, fontWeight: \"600\" },
  info: { backgroundColor: \"#1a1a2e\" },
  success: { backgroundColor: \"#0d3a2a\" },
  error: { backgroundColor: \"#3a1220\" },
  warning: { backgroundColor: \"#3a2812\" },
});
"
