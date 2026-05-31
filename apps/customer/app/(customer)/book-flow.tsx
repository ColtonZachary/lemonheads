import { Stack, useLocalSearchParams } from "expo-router";

import { BookingFlow } from "@/components/BookingFlow";

export default function BookFlowScreen() {
  const { packageKey } = useLocalSearchParams<{ packageKey?: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Book a detail",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#111318" },
          headerTintColor: "#edeae0",
        }}
      />
      <BookingFlow initialPackageKey={typeof packageKey === "string" ? packageKey : undefined} />
    </>
  );
}
