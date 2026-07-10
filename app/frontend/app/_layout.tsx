"import { Stack } from \"expo-router\";
import * as SplashScreen from \"expo-splash-screen\";
import { useEffect } from \"react\";
import { LogBox, StatusBar, View } from \"react-native\";
import { SafeAreaProvider } from \"react-native-safe-area-context\";
import { GestureHandlerRootView } from \"react-native-gesture-handler\";

import { useIconFonts } from \"@/src/hooks/use-icon-fonts\";
import { AuthProvider } from \"@/src/auth-context\";
import { ToastProvider } from \"@/src/components/Toast\";
import { colors } from \"@/src/theme\";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar barStyle=\"light-content\" backgroundColor=\"transparent\" translucent />
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: \"fade\",
                  contentStyle: { backgroundColor: colors.bg },
                }}
              />
            </View>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
"
