import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, View } from "react-native";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { initLang } from "@/src/i18n";
import { colors } from "@/src/theme";


LogBox.ignoreAllLogs(true);

const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('expo-notifications: Android Push notifications')
  ) {
    return;
  }
  originalConsoleError(...args);
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    initLang().finally(() => setLangReady(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && langReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, langReady]);

  if ((!loaded && !error) || !langReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: "fade",
        }}
      />
    </View>
  );
}
