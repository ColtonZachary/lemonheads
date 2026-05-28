import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { JobPhotosCard } from "@/components/JobPhotosCard";
import { JobWorkflowBar } from "@/components/JobWorkflowBar";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  formatDuration,
  formatJobDateLong,
  formatTimeRange,
  statusLabel,
  statusTone,
} from "@/lib/format";
import { formatJobAddress, openJobInMaps, openPhone } from "@/lib/maps";
import { colors } from "@/lib/theme";
import type {
  BookingJobPhoto,
  EmployeeJobDetail,
  EmployeeJobDetailResponse,
} from "@/lib/types";

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardHeader({
  icon,
  title,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <Ionicons name={icon} size={18} color={colors.muted} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.badge, styles[`badge_${tone}` as keyof typeof styles]]}>
      <Text style={styles.badgeText}>{statusLabel(status)}</Text>
    </View>
  );
}

function InCardRow({
  icon,
  label,
  children,
  expanded,
  onToggle,
  count,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  count?: number;
}) {
  const expandable = Boolean(onToggle);
  const body = (
    <>
      <View style={styles.inCardRowTop}>
        <View style={styles.inCardRowLeft}>
          <Ionicons name={icon} size={18} color={colors.muted} />
          <Text style={styles.inCardLabel}>{label}</Text>
        </View>
        <View style={styles.inCardRowRight}>
          {count != null && count > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          ) : null}
          {expandable ? (
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-forward"}
              size={18}
              color={colors.muted}
            />
          ) : null}
        </View>
      </View>
      {children && (expandable ? expanded : true) ? (
        <View style={styles.inCardExpanded}>{children}</View>
      ) : null}
    </>
  );

  if (expandable) {
    return (
      <Pressable onPress={onToggle} style={styles.inCardRow}>
        {body}
      </Pressable>
    );
  }

  return <View style={styles.inCardRow}>{body}</View>;
}

function ActionButton({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.actionBtnText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

function customerInitial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [job, setJob] = useState<EmployeeJobDetail | null>(null);
  const [photos, setPhotos] = useState<BookingJobPhoto[]>([]);
  const [beforePhotoCount, setBeforePhotoCount] = useState(0);
  const [afterPhotoCount, setAfterPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceOpen, setServiceOpen] = useState(true);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return;
    setError(null);
    try {
      const res = await apiGet<EmployeeJobDetailResponse>(
        `/api/mobile/employee/jobs/${id}`,
        session.access_token,
      );
      setJob(res.job);
      setPhotos(res.photos);
      setBeforePhotoCount(res.beforePhotoCount);
      setAfterPhotoCount(res.afterPhotoCount);
    } catch (err) {
      setJob(null);
      setError(err instanceof Error ? err.message : "Could not load job");
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Job not found"}</Text>
      </View>
    );
  }

  const address = formatJobAddress(job);
  const duration = formatDuration(job.startsAt, job.endsAt);
  const addonItems = [
    ...job.addons,
    ...(job.plasticShine ? ["Plastic shine"] : []),
  ];
  const paymentStatus = job.billedAt ? "Billed" : statusLabel(job.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: job.referenceId,
          headerRight: () => <StatusBadge status={job.status} />,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {session?.access_token ? (
          <JobWorkflowBar
            job={job}
            beforeCount={beforePhotoCount}
            afterCount={afterPhotoCount}
            accessToken={session.access_token}
            onJobUpdate={(updated) => setJob(updated)}
            onPhotosUpdate={(next, counts) => {
              setPhotos(next);
              setBeforePhotoCount(counts.before);
              setAfterPhotoCount(counts.after);
            }}
            onRefresh={load}
          />
        ) : null}

        <JobPhotosCard photos={photos} />

        {/* Location */}
        <Card>
          <CardHeader icon="location-outline" title="Location" />
          <View style={styles.route}>
            <View style={styles.routeDotColumn}>
              <View style={styles.routeDotStart} />
              <View style={styles.routeLine} />
              <View style={styles.routeDotEnd} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Customer</Text>
              <Text style={styles.routeAddress}>{address || "No address on file"}</Text>
              <Text style={styles.routeMeta}>{job.locationType}</Text>
            </View>
            {address ? (
              <Pressable
                onPress={() => openJobInMaps(job).catch(() => {})}
                style={styles.mapsBtn}
                hitSlop={8}
              >
                <Ionicons name="open-outline" size={20} color={colors.yellow} />
              </Pressable>
            ) : null}
          </View>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader icon="person-outline" title="Customer" />
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{customerInitial(job.customerName)}</Text>
            </View>
            <Text style={styles.customerName}>{job.customerName}</Text>
          </View>
          <View style={styles.actionRow}>
            <ActionButton
              icon="call-outline"
              label="Call"
              tint="#4ade80"
              onPress={() => openPhone(job.phone).catch(() => {})}
            />
            <ActionButton
              icon="mail-outline"
              label="Email"
              tint="#60a5fa"
              onPress={() => Linking.openURL(`mailto:${job.email}`).catch(() => {})}
            />
          </View>
        </Card>

        {/* Job details */}
        <Card>
          <InCardRow icon="calendar-outline" label="Date & time">
            <Text style={styles.rowBodyText}>
              {formatTimeRange(job.startsAt, job.endsAt)}
              {duration ? ` (${duration})` : ""}
            </Text>
            <Text style={styles.rowBodySub}>{formatJobDateLong(job.appointmentDate)}</Text>
          </InCardRow>

          <View style={styles.divider} />

          <InCardRow
            icon="pricetag-outline"
            label="Service"
            expanded={serviceOpen}
            onToggle={() => setServiceOpen((v) => !v)}
          >
            <Text style={styles.rowBodyText}>{job.serviceName}</Text>
            <Text style={styles.rowPrice}>{job.priceDisplay}</Text>
            {job.priceOriginal ? (
              <Text style={styles.rowBodySub}>
                Was {job.priceOriginal}
                {job.priceDiscount ? ` · ${job.priceDiscount} off` : ""}
              </Text>
            ) : null}
          </InCardRow>

          <View style={styles.divider} />

          <InCardRow
            icon="car-outline"
            label="Vehicle"
            expanded={vehicleOpen}
            onToggle={() => setVehicleOpen((v) => !v)}
          >
            <Text style={styles.rowBodyText}>{job.vehicleType}</Text>
            {job.vehicleInfo ? (
              <Text style={styles.rowBodySub}>{job.vehicleInfo}</Text>
            ) : null}
          </InCardRow>

          <View style={styles.divider} />

          <InCardRow
            icon="add-circle-outline"
            label="Add-ons"
            count={addonItems.length}
            expanded={addonsOpen}
            onToggle={() => setAddonsOpen((v) => !v)}
          >
            {addonItems.length ? (
              addonItems.map((name) => (
                <Text key={name} style={styles.rowBodyText}>
                  · {name}
                </Text>
              ))
            ) : (
              <Text style={styles.rowBodySub}>No add-ons</Text>
            )}
          </InCardRow>

          <View style={styles.divider} />

          <InCardRow icon="person-circle-outline" label="Detailer">
            <Text style={styles.rowBodyText}>{job.detailerName ?? "Unassigned"}</Text>
            {job.detailerAutoAssigned ? (
              <Text style={styles.rowBodySub}>Auto-assigned at booking</Text>
            ) : null}
          </InCardRow>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader icon="cash-outline" title="Payment" />
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="receipt-outline" size={22} color={colors.muted} />
              <Text style={styles.paymentAmount}>{job.priceDisplay}</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>{paymentStatus}</Text>
            </View>
          </View>
          <View style={styles.paymentMeta}>
            <View style={styles.paymentMetaItem}>
              <Text style={styles.paymentMetaLabel}>Card on file</Text>
              <Text style={styles.paymentMetaValue}>{job.cardOnFile ? "Yes" : "No"}</Text>
            </View>
            <View style={styles.paymentMetaItem}>
              <Text style={styles.paymentMetaLabel}>Early contact</Text>
              <Text style={styles.paymentMetaValue}>{job.earlyContactOk ? "OK" : "No"}</Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        <Card>
          <Pressable
            onPress={() => setNotesOpen((v) => !v)}
            style={styles.notesRow}
          >
            <View style={styles.notesLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.muted} />
              <Text style={styles.notesLabel}>Customer notes</Text>
            </View>
            <View style={styles.notesRight}>
              {job.customerNotes ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>1</Text>
                </View>
              ) : null}
              <Ionicons
                name={notesOpen ? "chevron-up" : "chevron-forward"}
                size={18}
                color={colors.muted}
              />
            </View>
          </Pressable>
          {notesOpen ? (
            <View style={styles.notesBody}>
              <Text style={styles.notesText}>
                {job.customerNotes || "No notes from the customer."}
              </Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.readOnly}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
          <Text style={styles.readOnlyText}>
            View only — managers update bookings in the hub.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  route: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  routeDotColumn: {
    alignItems: "center",
    paddingTop: 4,
  },
  routeDotStart: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
  routeLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routeDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeAddress: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  routeMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  mapsBtn: {
    padding: 4,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  customerName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inCardRow: {
    paddingVertical: 4,
  },
  inCardRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inCardRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  inCardRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inCardLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  inCardExpanded: {
    marginTop: 10,
    marginLeft: 28,
  },
  rowBodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  rowBodySub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  rowPrice: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentAmount: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  paymentBadge: {
    backgroundColor: "rgba(251,146,60,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paymentBadgeText: {
    color: "#fb923c",
    fontSize: 12,
    fontWeight: "700",
  },
  paymentMeta: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  paymentMetaItem: {
    flex: 1,
  },
  paymentMetaLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
  },
  paymentMetaValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notesLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notesLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  notesRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notesBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
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
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.text,
  },
  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: colors.red,
    textAlign: "center",
  },
});
