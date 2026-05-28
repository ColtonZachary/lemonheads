import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.yellow,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.card } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Sign in" }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
