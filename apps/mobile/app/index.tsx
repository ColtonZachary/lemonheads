import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function Index() {
  const { loading, session, employee, error } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (!session || !employee) {
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Redirect href="/login" />
        </View>
      );
    }
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(employee)/(tabs)/jobs" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  error: {
    color: colors.red,
    textAlign: "center",
    marginBottom: 16,
  },
});
