import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";
import type { EmployeePayResponse } from "@/lib/types";
import { currentWeekMonday, shiftWeekMonday } from "@/lib/week";

export default function PayScreen() {
  const { session } = useAuth();
  const [weekMonday, setWeekMonday] = useState(currentWeekMonday);
  const [data, setData] = useState<EmployeePayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setError(null);
    try {
      const res = await apiGet<EmployeePayResponse>(
        `/api/mobile/employee/pay?week=${weekMonday}`,
        session.access_token,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pay");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, weekMonday]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const week = data?.week;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.yellow} />
      }
    >
      <View style={styles.weekRow}>
        <Pressable
          onPress={() => setWeekMonday((w) => shiftWeekMonday(w, -1))}
          style={styles.weekBtn}
        >
          <Text style={styles.weekBtnText}>←</Text>
        </Pressable>
        <Text style={styles.weekLabel}>{data?.weekLabel ?? "This week"}</Text>
        <Pressable
          onPress={() => setWeekMonday((w) => shiftWeekMonday(w, 1))}
          style={styles.weekBtn}
        >
          <Text style={styles.weekBtnText}>→</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading && !data ? (
        <ActivityIndicator color={colors.yellow} style={styles.loader} />
      ) : (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated pay this week</Text>
            <Text style={styles.total}>{week?.totalPayDisplay ?? "$0.00"}</Text>
            <Text style={styles.meta}>
              {data?.tierLabel ?? "Regular"} · {week?.jobCount ?? 0} job
              {(week?.jobCount ?? 0) === 1 ? "" : "s"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Jobs</Text>
          {!week?.jobs.length ? (
            <Text style={styles.empty}>No paid jobs this week yet.</Text>
          ) : (
            week.jobs.map((job, index) => (
              <View key={`${job.appointmentDate}-${job.serviceName}-${index}`} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowService}>{job.serviceName}</Text>
                  <Text style={styles.rowDate}>{job.appointmentDate}</Text>
                </View>
                <Text style={styles.rowPay}>{job.totalPayDisplay}</Text>
              </View>
            ))
          )}

          <Text style={styles.footnote}>
            Pay matches hub Reports / My pay. Rates update when managers change pay settings.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 32,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekBtn: {
    padding: 8,
  },
  weekBtnText: {
    color: colors.yellow,
    fontSize: 20,
  },
  weekLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  totalCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  total: {
    color: colors.yellow,
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
    paddingRight: 12,
  },
  rowService: {
    color: colors.text,
    fontSize: 15,
  },
  rowDate: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  rowPay: {
    color: colors.yellow,
    fontWeight: "600",
  },
  empty: {
    color: colors.muted,
    marginHorizontal: 16,
  },
  footnote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginHorizontal: 16,
    marginTop: 20,
  },
  error: {
    color: colors.red,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});
