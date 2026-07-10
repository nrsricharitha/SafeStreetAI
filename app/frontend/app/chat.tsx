"import React, { useEffect, useRef, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { Ionicons } from \"@expo/vector-icons\";
import { LinearGradient } from \"expo-linear-gradient\";

import { AnimatedBackground } from \"@/src/components/AnimatedBackground\";
import { ScreenHeader } from \"@/src/components/ScreenHeader\";
import { colors, font, gradients, radius } from \"@/src/theme\";
import { api } from \"@/src/api\";
import { useToast } from \"@/src/components/Toast\";

type Msg = { role: \"user\" | \"assistant\"; text: string; ts: number };

const SUGGESTIONS = [
  \"I'm walking home alone at night\",
  \"Someone is following me — what should I do?\",
  \"How do I stay safe on public transport?\",
  \"Tips to de-escalate a threat\",
];

export default function Chat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([
    { role: \"assistant\", text: \"Hi, I'm Aegis, your AI safety companion. How can I help you feel safer right now?\", ts: Date.now() },
  ]);
  const [text, setText] = useState(\"\");
  const [busy, setBusy] = useState(false);
  const sessionId = useRef(`session-${Date.now()}`);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async (t?: string) => {
    const msg = (t ?? text).trim();
    if (!msg) return;
    setText(\"\");
    const newMsgs = [...messages, { role: \"user\" as const, text: msg, ts: Date.now() }];
    setMessages(newMsgs);
    setBusy(true);
    try {
      const res = await api.post<{ reply: string }>(\"/chat\", { session_id: sessionId.current, message: msg });
      setMessages([...newMsgs, { role: \"assistant\" as const, text: res.reply, ts: Date.now() }]);
    } catch (e: any) {
      toast(e.message || \"Chat failed\", \"error\");
      setMessages([...newMsgs, { role: \"assistant\" as const, text: \"I'm having trouble connecting right now. Please try again in a moment.\", ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID=\"chat-screen\">
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }} edges={[\"top\", \"bottom\"]}>
        <View style={{ padding: 20, paddingBottom: 8 }}>
          <ScreenHeader title=\"Aegis AI\" subtitle=\"Your safety companion\" />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === \"ios\" ? \"padding\" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={20}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps=\"handled\"
          >
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === \"user\" ? styles.bubbleUser : styles.bubbleAI]}>
                {m.role === \"assistant\" && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name=\"sparkles\" size={14} color=\"#fff\" />
                  </View>
                )}
                <View style={m.role === \"user\" ? styles.userBox : styles.aiBox}>
                  {m.role === \"user\" ? (
                    <LinearGradient colors={gradients.cool} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text style={{ color: \"#fff\", fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
                </View>
              </View>
            ))}
            {busy && (
              <View style={[styles.bubble, styles.bubbleAI]}>
                <View style={styles.aiAvatar}><Ionicons name=\"sparkles\" size={14} color=\"#fff\" /></View>
                <View style={styles.aiBox}>
                  <Text style={{ color: colors.textSecondary }}>Aegis is thinking…</Text>
                </View>
              </View>
            )}
            {messages.length <= 1 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: colors.textSecondary, ...font.label, marginBottom: 10 }}>SUGGESTED</Text>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} style={styles.suggest} testID={`chat-suggest-${s.slice(0, 12)}`}>
                    <Ionicons name=\"sparkles-outline\" size={14} color={colors.cyan} />
                    <Text style={{ color: \"#fff\", flex: 1 }}>{s}</Text>
                    <Ionicons name=\"arrow-forward\" size={14} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              placeholder=\"Ask Aegis for help…\"
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              style={styles.input}
              onSubmitEditing={() => send()}
              testID=\"chat-input\"
              multiline
            />
            <Pressable
              onPress={() => send()}
              disabled={busy || !text.trim()}
              style={[styles.sendBtn, (busy || !text.trim()) && { opacity: 0.5 }]}
              testID=\"chat-send\"
            >
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Ionicons name=\"arrow-up\" size={20} color=\"#fff\" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { flexDirection: \"row\", alignItems: \"flex-end\", gap: 8, marginBottom: 12 },
  bubbleUser: { justifyContent: \"flex-end\" },
  bubbleAI: { justifyContent: \"flex-start\" },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.purple, alignItems: \"center\", justifyContent: \"center\",
  },
  userBox: {
    maxWidth: \"80%\", padding: 14, borderRadius: 20, borderBottomRightRadius: 6,
    overflow: \"hidden\", marginLeft: \"20%\",
  },
  aiBox: {
    maxWidth: \"80%\", padding: 14, borderRadius: 20, borderBottomLeftRadius: 6,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.05)\",
  },
  suggest: {
    flexDirection: \"row\", alignItems: \"center\", gap: 10, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, backgroundColor: \"rgba(255,255,255,0.03)\", marginBottom: 8,
  },
  inputBar: {
    flexDirection: \"row\", alignItems: \"flex-end\", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: \"rgba(5,5,10,0.9)\",
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    backgroundColor: \"rgba(255,255,255,0.05)\", color: \"#fff\", fontSize: 15,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: \"center\", justifyContent: \"center\",
    overflow: \"hidden\",
  },
});
"
