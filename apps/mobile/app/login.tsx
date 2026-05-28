import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, session, employee, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || authLoading;

  useEffect(() => {
    if (session && employee) {
      router.replace("/(employee)/(tabs)/jobs");
    }
  }, [session, employee, router]);

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.brand}>Lemonhead's</Text>
      <Text style={styles.subtitle}>Employee app</Text>
      <Text style={styles.hint}>
        Use the same email and password as hub login. Detailers only.
      </Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />

      {(error || authError) && (
        <Text style={styles.error}>{error ?? authError}</Text>
      )}

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>

      {busy && !error && !authError ? (
        <Text style={styles.status}>Signing in…</Text>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: "center",
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.yellow,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  hint: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.yellow,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: colors.red,
    marginBottom: 12,
    fontSize: 13,
  },
  status: {
    marginTop: 12,
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
  },
});
