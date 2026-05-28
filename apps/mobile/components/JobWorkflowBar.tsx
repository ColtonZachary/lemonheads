import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiPost, apiUploadPhoto } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { BookingJobPhoto, EmployeeJobDetail } from "@/lib/types";

import { JobChecklistModal } from "./JobChecklistModal";

export function JobWorkflowBar({
  job,
  beforeCount,
  afterCount,
  accessToken,
  onRefresh,
  onJobUpdate,
  onPhotosUpdate,
}: {
  job: EmployeeJobDetail;
  beforeCount: number;
  afterCount: number;
  accessToken: string;
  onRefresh: () => void | Promise<void>;
  onJobUpdate?: (job: EmployeeJobDetail) => void;
  onPhotosUpdate?: (
    photos: BookingJobPhoto[],
    counts: { before: number; after: number },
  ) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const phase = job.detailPhase;

  const runWorkflow = async (action: "start" | "arrived" | "finished") => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiPost<{
        ok: boolean;
        phase: string;
        smsQueued?: boolean;
        job?: EmployeeJobDetail | null;
      }>(`/api/mobile/employee/jobs/${job.id}/workflow`, accessToken, { action });
      if (res.job) {
        onJobUpdate?.(res.job);
      }
      const phaseLabels: Record<string, string> = {
        en_route: "On the way — customer can be notified.",
        arrived: "Marked arrived.",
        awaiting_after_photos: "Finished — add after photos next.",
      };
      setMessage(
        phaseLabels[res.phase] ??
          (res.smsQueued
            ? "Customer notified by text."
            : "Step saved."),
      );
      await onRefresh();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (photoPhase: "before" | "after") => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access", "Allow camera to take job photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setBusy(true);
    try {
      const res = await apiUploadPhoto(
        job.id,
        photoPhase,
        result.assets[0].uri,
        accessToken,
      );
      if (res.photos) {
        onPhotosUpdate?.(res.photos, {
          before: res.beforeCount,
          after: res.afterCount,
        });
      }
      await onRefresh();
      if (res.phase === "awaiting_checklist") {
        setChecklistOpen(true);
      }
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "complete") {
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.completeTitle}>Job complete</Text>
          <Text style={styles.completeSub}>Checklist finished. Great work.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.workflowTitle}>Job workflow</Text>

        {phase === "awaiting_start" && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => runWorkflow("start")}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>Start — on the way</Text>
            )}
          </Pressable>
        )}

        {phase === "en_route" && (
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => runWorkflow("arrived")}
          >
            <Text style={styles.primaryBtnText}>I've arrived</Text>
          </Pressable>
        )}

        {(phase === "arrived" || phase === "awaiting_finish") && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Add before photos ({beforeCount} saved — see Job photos below)
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              disabled={busy}
              onPress={() => pickPhoto("before")}
            >
              <Text style={styles.secondaryBtnText}>+ Add before photo</Text>
            </Pressable>
            {beforeCount > 0 && (
              <Pressable
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={() => runWorkflow("finished")}
              >
                <Text style={styles.primaryBtnText}>Finished — notify customer</Text>
              </Pressable>
            )}
          </View>
        )}

        {phase === "awaiting_after_photos" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Add after photos ({afterCount} saved — see Job photos below)
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              disabled={busy}
              onPress={() => pickPhoto("after")}
            >
              <Text style={styles.secondaryBtnText}>+ Add after photo</Text>
            </Pressable>
            {afterCount > 0 && (
              <Pressable
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy}
                onPress={() => setChecklistOpen(true)}
              >
                <Text style={styles.primaryBtnText}>Open checklist</Text>
              </Pressable>
            )}
          </View>
        )}

        {phase === "awaiting_checklist" && (
          <Pressable
            style={styles.primaryBtn}
            onPress={() => setChecklistOpen(true)}
          >
            <Text style={styles.primaryBtnText}>Complete checklist</Text>
          </Pressable>
        )}

        {message ? <Text style={styles.hint}>{message}</Text> : null}
      </View>

      <JobChecklistModal
        visible={checklistOpen}
        bookingId={job.id}
        accessToken={accessToken}
        onClose={() => setChecklistOpen(false)}
        onComplete={onRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.yellow,
    padding: 16,
    marginBottom: 12,
  },
  workflowTitle: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  section: {
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  completeTitle: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: "700",
  },
  completeSub: {
    color: colors.muted,
    marginTop: 4,
  },
});
