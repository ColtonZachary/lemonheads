import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function EmployeeTabLayout() {
  const { signOut, employee } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerRight: () => (
          <Pressable onPress={() => signOut()} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: employee?.detailerName ?? "My jobs",
          tabBarLabel: "Jobs",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: "My pay",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cash-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
  },
  signOut: {
    marginRight: 12,
    paddingVertical: 4,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 13,
  },
});
