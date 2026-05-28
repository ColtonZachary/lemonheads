import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/lib/theme";
import type { BookingJobPhoto } from "@/lib/types";

export function JobPhotosCard({ photos }: { photos: BookingJobPhoto[] }) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const before = photos.filter((p) => p.phase === "before");
  const after = photos.filter((p) => p.phase === "after");

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>Job photos</Text>
        <PhotoRow
          label="Before"
          photos={before}
          onPress={(url) => setViewerUrl(url)}
        />
        <PhotoRow
          label="After"
          photos={after}
          onPress={(url) => setViewerUrl(url)}
        />
        {before.length + after.length > 0 ? (
          <Text style={styles.hint}>Tap a photo to view full size.</Text>
        ) : null}
      </View>

      <Modal
        visible={viewerUrl != null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUrl(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerUrl(null)}>
          {viewerUrl ? (
            <Image
              source={{ uri: viewerUrl }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.viewerClose}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>
    </>
  );
}

function PhotoRow({
  label,
  photos,
  onPress,
}: {
  label: string;
  photos: BookingJobPhoto[];
  onPress: (url: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {label} ({photos.length})
      </Text>
      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((p) => (
            <Pressable key={p.id} onPress={() => onPress(p.url)}>
              <Image source={{ uri: p.url }} style={styles.thumb} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No {label.toLowerCase()} photos yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    marginBottom: 12,
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  viewerClose: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 16,
  },
});
