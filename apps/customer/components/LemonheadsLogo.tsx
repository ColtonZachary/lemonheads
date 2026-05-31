import { View } from "react-native";

import { Text } from "@lemonheads/mobile-ui";

export function LemonheadsLogo() {
  return (
    <View className="items-center">
      <Text className="text-4xl font-bold tracking-[0.12em] text-primary">LEMONHEADS</Text>
      <Text variant="subtitle" className="mt-2 tracking-[0.2em]">
        Mobile Detail
      </Text>
    </View>
  );
}
