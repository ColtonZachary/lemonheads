import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePushRegistration } from "@/lib/push-registration-context";
import { colors } from "@/lib/theme";

export function PushRegistrationBanner() {
  const { status, message, retry } = usePushRegistration();

  if (status !== "failed" || !message) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Job alerts not enabled</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={retry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: "rgba(248,113,113,0.12)",
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  retryBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.yellow,
  },
  retryText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 13,
  },
});
