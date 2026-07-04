import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Screen,
  ScreenCenter,
  Text,
} from "@lemonheads/mobile-ui";

import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";

export default function RewardsScreen() {
  const router = useRouter();
  const { customer, loading, refreshCustomer } = useAuth();

  if (loading) {
    return (
      <ScreenCenter>
        <ActivityIndicator color="#f0c93a" />
      </ScreenCenter>
    );
  }

  if (!customer) {
    return (
      <ScreenCenter>
        <Text variant="title" className="text-center">
          {BRAND.name} Rewards
        </Text>
        <Text variant="muted" className="mb-5 mt-2 text-center leading-5">
          Earn points on every detail. Sign in with the email from your booking to see your
          balance and redeem rewards.
        </Text>
        <Button onPress={() => router.push("/login")}>Sign in</Button>
      </ScreenCenter>
    );
  }

  return (
    <Screen className="p-4">
      <Card className="mb-5 items-center border-primary">
        <CardHeader className="items-center">
          <Text variant="subtitle">Your points</Text>
          <Text className="mt-2 text-5xl font-bold text-primary">{customer.pointsBalance}</Text>
          <CardTitle className="mt-2 font-normal">
            Hi, {customer.fullName.split(" ")[0]}
          </CardTitle>
        </CardHeader>
      </Card>

      <Text variant="muted" className="mb-4 leading-5">
        Redeeming rewards in the app is coming next. For now, use rewards at checkout on the
        website when you book.
      </Text>

      <Button variant="outline" onPress={() => void refreshCustomer()}>
        Refresh balance
      </Button>
    </Screen>
  );
}
