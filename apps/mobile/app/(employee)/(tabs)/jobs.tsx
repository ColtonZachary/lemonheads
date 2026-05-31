import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  centralTodayDateKey,
  detailPhaseLabel,
  detailPhaseTone,
  formatDuration,
  formatMonthDay,
  formatTimeRange,
  formatWeekdayLong,
  formatWeekdayShort,
  statusLabel,
  statusTone,
} from "@/lib/format";
import { formatJobAddress } from "@/lib/maps";
import { colors } from "@/lib/theme";
import type { EmployeeJob, EmployeeJobsResponse } from "@/lib/types";
import { addDaysToDateInput, currentWeekMonday, shiftWeekMonday } from "@/lib/week";

type DayPill = {
  dateKey: string;
  weekday: string;
  dayNum: string;
  jobCount: number;
};

type JobSection = {
  dateKey: string;
  title: string;
  data: EmployeeJob[];
};

function buildWeekPills(weekMonday: string, jobs: EmployeeJob[]): DayPill[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    counts.set(job.appointment_date, (counts.get(job.appointment_date) ?? 0) + 1);
  }
  const pills: DayPill[] = [];
  for (let i = 0; i < 7; i++) {
    const dateKey = addDaysToDateInput(weekMonday, i);
    pills.push({
      dateKey,
      weekday: formatWeekdayShort(dateKey),
      dayNum: dateKey.slice(8, 10).replace(/^0/, ""),
      jobCount: counts.get(dateKey) ?? 0,
    });
  }
  return pills;
}

function buildSections(jobs: EmployeeJob[], selectedDate: string): JobSection[] {
  const filtered = jobs.filter((j) => j.appointment_date === selectedDate);
  if (!filtered.length) return [];

  return [
    {
      dateKey: selectedDate,
      title: formatWeekdayLong(selectedDate),
      data: filtered,
    },
  ];
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.badge, styles[`badge_${tone}` as keyof typeof styles]]}>
      <Text style={styles.badgeText}>{statusLabel(status)}</Text>
    </View>
  );
}

function WorkflowBadge({ phase }: { phase: string }) {
  const tone = detailPhaseTone(phase);
  return (
    <View style={[styles.badge, styles[`badge_${tone}` as keyof typeof styles]]}>
      <Text style={styles.badgeText}>{detailPhaseLabel(phase)}</Text>
    </View>
  );
}

function JobCard({
  job,
  onPress,
}: {
  job: EmployeeJob;
  onPress: () => void;
}) {
  const duration = formatDuration(job.starts_at, job.ends_at);
  const address = formatJobAddress(job);
  const showWorkflow =
    job.status !== "cancelled" &&
    job.status !== "completed" &&
    job.detailPhase !== "awaiting_start";

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardStripe} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.ref}>{job.reference_id}</Text>
          <View style={styles.badgeRow}>
            {showWorkflow ? <WorkflowBadge phase={job.detailPhase} /> : null}
            <StatusBadge status={job.status} />
          </View>
        </View>
        <Text style={styles.time}>{formatTimeRange(job.starts_at, job.ends_at)}</Text>
        <Text style={styles.meta}>
          {duration ? `${duration} · ` : ""}
          {job.priceDisplay}
        </Text>
        <Text style={styles.service}>{job.service_name}</Text>
        <Text style={styles.vehicle}>{job.vehicle_type}</Text>
        <Text style={styles.customer}>{job.customer_name}</Text>
        {address ? <Text style={styles.address}>{address}</Text> : null}
        {job.addons.length > 0 ? (
          <Text style={styles.addons}>{job.addons.join(" · ")}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.viewDetail}>View details</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}

export default function JobsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [weekMonday, setWeekMonday] = useState(currentWeekMonday);
  const [selectedDate, setSelectedDate] = useState(centralTodayDateKey());
  const [data, setData] = useState<EmployeeJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setError(null);
    try {
      const res = await apiGet<EmployeeJobsResponse>(
        `/api/mobile/employee/jobs?week=${weekMonday}`,
        session.access_token,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, weekMonday]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const weekEnd = addDaysToDateInput(weekMonday, 6);
    const today = centralTodayDateKey();
    if (today >= weekMonday && today <= weekEnd) {
      setSelectedDate(today);
    } else {
      setSelectedDate(weekMonday);
    }
  }, [weekMonday]);

  const pills = useMemo(
    () => buildWeekPills(weekMonday, data?.jobs ?? []),
    [weekMonday, data?.jobs],
  );

  const sections = useMemo(
    () => buildSections(data?.jobs ?? [], selectedDate),
    [data?.jobs, selectedDate],
  );

  const dayJobCount = sections[0]?.data.length ?? 0;
  const completedCount =
    sections[0]?.data.filter((j) => j.status === "completed").length ?? 0;

  return (
    <View style={styles.container}>
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

      <View style={styles.dayStrip}>
        {pills.map((pill) => {
          const selected = pill.dateKey === selectedDate;
          return (
            <Pressable
              key={pill.dateKey}
              onPress={() => setSelectedDate(pill.dateKey)}
              style={[styles.dayPill, selected && styles.dayPillSelected]}
            >
              <Text style={[styles.dayWeekday, selected && styles.dayTextSelected]}>
                {pill.weekday}
              </Text>
              <Text style={[styles.dayNum, selected && styles.dayTextSelected]}>
                {pill.dayNum}
              </Text>
              {pill.jobCount > 0 ? (
                <View
                  style={[styles.dayDot, selected && styles.dayDotSelected]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          {formatWeekdayLong(selectedDate)}
        </Text>
        <Text style={styles.daySub}>
          {formatMonthDay(selectedDate)}
          {dayJobCount > 0
            ? ` · ${completedCount} of ${dayJobCount} done`
            : " · No jobs"}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !data ? (
        <ActivityIndicator color={colors.yellow} style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={colors.yellow}
            />
          }
          contentContainerStyle={
            sections.length ? styles.list : styles.listEmpty
          }
          renderSectionHeader={() => null}
          ListEmptyComponent={
            <Text style={styles.empty}>No jobs on this day.</Text>
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/job/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  dayStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 10,
  },
  dayPillSelected: {
    backgroundColor: colors.yellow,
  },
  dayWeekday: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
  },
  dayNum: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  dayTextSelected: {
    color: colors.bg,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.yellow,
    marginTop: 4,
  },
  dayDotSelected: {
    backgroundColor: colors.bg,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  dayTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  daySub: {
    color: colors.muted,
    fontSize: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardStripe: {
    width: 4,
    backgroundColor: colors.yellow,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    justifyContent: "flex-end",
  },
  ref: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  time: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  service: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  vehicle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  customer: {
    color: colors.text,
    fontSize: 14,
    marginTop: 8,
  },
  address: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  addons: {
    color: colors.yellow,
    fontSize: 12,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 4,
  },
  viewDetail: {
    color: colors.muted,
    fontSize: 12,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badge_done: {
    backgroundColor: "rgba(34,197,94,0.2)",
  },
  badge_active: {
    backgroundColor: "rgba(232,212,77,0.2)",
  },
  badge_pending: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  badge_cancelled: {
    backgroundColor: "rgba(248,113,113,0.15)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.text,
  },
  empty: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 40,
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
