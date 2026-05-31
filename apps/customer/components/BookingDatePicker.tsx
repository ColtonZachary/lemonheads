import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@lemonheads/mobile-ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function centralTodayDateInput(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateInputFromParts(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type BookableDate = {
  dateInput: string;
  label: string;
};

type CalendarCell = {
  day: number | null;
  dateInput: string | null;
  bookable: boolean;
  isToday: boolean;
};

type Props = {
  dates: BookableDate[];
  loading?: boolean;
  selectedLabel: string;
  onSelect: (label: string) => void;
};

export function BookingDatePicker({ dates, loading, selectedLabel, onSelect }: Props) {
  const todayKey = centralTodayDateInput();
  const bookableByInput = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of dates) {
      map.set(entry.dateInput, entry.label);
    }
    return map;
  }, [dates]);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  useEffect(() => {
    if (!dates.length) return;
    const anchor = dates.find((entry) => entry.label === selectedLabel) ?? dates[0];
    if (!anchor) return;
    const [y, m] = anchor.dateInput.split("-").map(Number);
    setCursor({ y, m: m - 1 });
  }, [dates, selectedLabel]);

  const cells = useMemo((): CalendarCell[] => {
    const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const grid: CalendarCell[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      grid.push({ day: null, dateInput: null, bookable: false, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateInput = dateInputFromParts(cursor.y, cursor.m, day);
      grid.push({
        day,
        dateInput,
        bookable: bookableByInput.has(dateInput),
        isToday: dateInput === todayKey,
      });
    }

    return grid;
  }, [bookableByInput, cursor.m, cursor.y, todayKey]);

  const monthHasBookable = useMemo(
    () => cells.some((cell) => cell.bookable),
    [cells],
  );

  if (loading) {
    return <ActivityIndicator color="#f0c93a" className="py-6" />;
  }

  if (!dates.length) {
    return (
      <Text variant="muted" className="py-4 text-center leading-5">
        No available dates for this location right now. Try a different address or check back
        soon.
      </Text>
    );
  }

  return (
    <View className="rounded-xl border border-border bg-card p-3">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() =>
            setCursor((current) =>
              current.m === 0
                ? { y: current.y - 1, m: 11 }
                : { y: current.y, m: current.m - 1 },
            )
          }
          hitSlop={12}
          className="rounded-lg border border-border px-3 py-2"
        >
          <Ionicons name="chevron-back" size={18} color="#edeae0" />
        </Pressable>

        <Text className="text-base font-bold text-foreground">
          {MONTHS[cursor.m]} {cursor.y}
        </Text>

        <Pressable
          onPress={() =>
            setCursor((current) =>
              current.m === 11
                ? { y: current.y + 1, m: 0 }
                : { y: current.y, m: current.m + 1 },
            )
          }
          hitSlop={12}
          className="rounded-lg border border-border px-3 py-2"
        >
          <Ionicons name="chevron-forward" size={18} color="#edeae0" />
        </Pressable>
      </View>

      <View className="mb-1 flex-row">
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} className="flex-1 items-center py-1">
            <Text variant="muted" className="text-[10px] font-semibold uppercase tracking-wider">
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((cell, index) => {
          if (cell.day === null || !cell.dateInput) {
            return <View key={`empty-${index}`} className="aspect-square w-[14.28%]" />;
          }

          const label = bookableByInput.get(cell.dateInput);
          const selected = Boolean(label && selectedLabel === label);
          const disabled = !cell.bookable;

          return (
            <Pressable
              key={cell.dateInput}
              disabled={disabled}
              onPress={() => label && onSelect(label)}
              className={`aspect-square w-[14.28%] items-center justify-center rounded-lg border ${
                disabled
                  ? "border-transparent opacity-30"
                  : selected
                    ? "border-primary bg-primary"
                    : cell.isToday
                      ? "border-primary/50 bg-primary/5"
                      : "border-transparent bg-secondary/40"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected ? "text-primary-foreground" : disabled ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!monthHasBookable ? (
        <Text variant="muted" className="mt-3 text-center text-xs leading-5">
          No open days this month — try another month.
        </Text>
      ) : null}

      {selectedLabel ? (
        <Text className="mt-3 text-center text-sm text-primary">{selectedLabel}</Text>
      ) : (
        <Text variant="muted" className="mt-3 text-center text-xs">
          Tap an available day to continue.
        </Text>
      )}
    </View>
  );
}
