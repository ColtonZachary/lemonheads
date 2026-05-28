import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function EmployeeLayout() {
  const { loading, session, employee } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (!session || !employee) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="job/[id]"
        options={{
          title: "Job",
          headerBackTitle: "Jobs",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
