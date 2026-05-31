import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PushRegistrationBanner } from "@/components/PushRegistrationBanner";

import { useAuth } from "@/lib/auth-context";
import { unregisterPushToken } from "@/lib/push-notifications";
import { colors } from "@/lib/theme";

export default function EmployeeTabLayout() {
  const { signOut, employee, session } = useAuth();

  const handleSignOut = async () => {
    if (session?.access_token) {
      await unregisterPushToken(session.access_token);
    }
    await signOut();
  };

  return (
    <View style={styles.root}>
      <PushRegistrationBanner />
      <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerRight: () => (
          <Pressable onPress={() => void handleSignOut()} style={styles.signOut}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabs: {
    flex: 1,
  },
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
