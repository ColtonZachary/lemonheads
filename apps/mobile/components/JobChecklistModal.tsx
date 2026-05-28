import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiGet, apiPost } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { ChecklistItem } from "@/lib/types";

export function JobChecklistModal({
  visible,
  bookingId,
  accessToken,
  onClose,
  onComplete,
}: {
  visible: boolean;
  bookingId: string;
  accessToken: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    apiGet<{ items: ChecklistItem[] }>(
      `/api/mobile/employee/jobs/${bookingId}/checklist`,
      accessToken,
    )
      .then((res) => {
        setItems(res.items);
        const init: Record<string, boolean> = {};
        for (const item of res.items) init[item.id] = false;
        setChecked(init);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [visible, bookingId, accessToken]);

  const toggle = (id: string) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  };

  const allChecked = items.length > 0 && items.every((i) => checked[i.id]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(
        `/api/mobile/employee/jobs/${bookingId}/checklist`,
        accessToken,
        {
          answers: items.map((i) => ({ itemId: i.id, checked: checked[i.id] ?? false })),
        },
      );
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete checklist");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <Text style={styles.title}>Job checklist</Text>
        <Text style={styles.subtitle}>
          Confirm each item before completing this job.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.yellow} style={{ marginTop: 24 }} />
        ) : (
          <ScrollView style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggle(item.id)}
                style={styles.row}
              >
                <View
                  style={[
                    styles.checkbox,
                    checked[item.id] && styles.checkboxOn,
                  ]}
                >
                  {checked[item.id] ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.label}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={!allChecked || submitting}
            style={[styles.doneBtn, (!allChecked || submitting) && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.doneText}>Complete job</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    paddingTop: 48,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 14,
  },
  list: {
    flex: 1,
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  checkmark: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.muted,
    fontWeight: "600",
  },
  doneBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.yellow,
  },
  doneText: {
    color: colors.bg,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: colors.red,
    marginTop: 8,
    textAlign: "center",
  },
});
