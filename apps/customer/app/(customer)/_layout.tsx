import { Stack } from "expo-router";

import { colors } from "@/lib/theme";

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book-flow" options={{ title: "Book a detail" }} />
    </Stack>
  );
}
