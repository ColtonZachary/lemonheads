import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function CustomerTabLayout() {
  const router = useRouter();
  const { customer, signOut, session } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerRight: () =>
          customer ? (
            <Pressable onPress={() => void handleSignOut()} style={styles.signOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          ) : session ? null : (
            <Pressable onPress={() => router.push("/login")} style={styles.signOut}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          ),
      }}
    >
      <Tabs.Screen
        name="book"
        options={{
          title: "Book",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{
          title: "Garage",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="car-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color }) => (
            <Ionicons name="gift-outline" size={24} color={color} />
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
  signInLink: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "600",
  },
});
