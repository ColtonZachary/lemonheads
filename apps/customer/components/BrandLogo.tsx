import { View } from "react-native";

import { Text } from "@lemonheads/mobile-ui";

import { BRAND } from "@/lib/brand";

export function BrandLogo() {
  return (
    <View className="items-center">
      <Text className="text-4xl font-bold tracking-[0.12em] text-primary">
        {BRAND.shortName}
      </Text>
      <Text variant="subtitle" className="mt-2 tracking-[0.2em]">
        {BRAND.tagline}
      </Text>
    </View>
  );
}
