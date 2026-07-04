import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";

import { Button, Input, Label, Text } from "@lemonheads/mobile-ui";

import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, session, customer, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || authLoading;

  useEffect(() => {
    if (session && customer) {
      router.replace("/(customer)/(tabs)/rewards");
    }
  }, [session, customer, router]);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center bg-background px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text variant="title">{BRAND.name}</Text>
      <Text variant="subtitle">Rewards & bookings</Text>
      <Text variant="muted" className="mb-6 mt-4 leading-5">
        Use the same email and password as rewards on the website. You must have booked at
        least once so we can link your account.
      </Text>

      <View className="flex flex-col gap-3">
        <View>
          <Label nativeID="email">Email</Label>
          <Input
            accessibilityLabelledBy="email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />
        </View>
        <View>
          <Label nativeID="password">Password</Label>
          <Input
            accessibilityLabelledBy="password"
            secureTextEntry
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />
        </View>
      </View>

      {(error || authError) ? (
        <Text variant="error" className="mt-4">
          {error ?? authError}
        </Text>
      ) : null}

      <Button className="mt-6" loading={busy} disabled={busy} onPress={onSubmit}>
        Sign in
      </Button>

      <Pressable className="mt-4 items-center py-2" onPress={() => router.back()} disabled={busy}>
        <Text variant="muted">Continue without signing in</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
