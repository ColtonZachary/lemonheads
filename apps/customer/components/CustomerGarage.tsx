import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Text,
} from "@lemonheads/mobile-ui";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CustomerVehicle, CustomerVehiclesResponse, VehicleOption } from "@/lib/types";

function vehicleTitle(vehicle: CustomerVehicle): string {
  if (vehicle.nickname.trim()) return vehicle.nickname.trim();
  if (vehicle.vehicleInfo.trim()) return vehicle.vehicleInfo.trim();
  return vehicle.vehicleLabel;
}

function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 rounded-xl border px-4 py-3 ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <Text className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="muted" className="mt-0.5 text-xs">
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

type Props = {
  vehicleOptions: VehicleOption[];
  optionsLoading?: boolean;
  onFormOpen?: () => void;
};

export function CustomerGarage({ vehicleOptions, optionsLoading, onFormOpen }: Props) {
  const router = useRouter();
  const { session, customer, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleKey, setVehicleKey] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [nickname, setNickname] = useState("");

  const load = useCallback(async () => {
    if (!session?.access_token || !customer) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiGet<CustomerVehiclesResponse>(
        "/api/mobile/customer/vehicles",
        session.access_token,
      );
      setVehicles(res.vehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load garage");
    } finally {
      setLoading(false);
    }
  }, [customer, session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!vehicleKey && vehicleOptions.length) {
      setVehicleKey(vehicleOptions[0]?.key ?? "");
    }
  }, [vehicleKey, vehicleOptions]);

  const resetForm = () => {
    setEditingId(null);
    setVehicleInfo("");
    setNickname("");
    setVehicleKey(vehicleOptions[0]?.key ?? "");
    setShowForm(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setVehicleInfo("");
    setNickname("");
    setVehicleKey(vehicleOptions[0]?.key ?? "");
    setShowForm(true);
    onFormOpen?.();
  };

  const startEdit = (vehicle: CustomerVehicle) => {
    setEditingId(vehicle.id);
    setVehicleKey(vehicle.vehicleKey);
    setVehicleInfo(vehicle.vehicleInfo);
    setNickname(vehicle.nickname);
    setShowForm(true);
    onFormOpen?.();
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!vehicleKey) {
      setError("Select a vehicle type");
      return;
    }
    if (vehicleInfo.trim().length < 2) {
      setError("Enter year, make, model, and color");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        vehicleKey,
        vehicleInfo: vehicleInfo.trim(),
        nickname: nickname.trim(),
      };

      if (editingId) {
        await apiPatch<{ vehicle: CustomerVehicle }>(
          `/api/mobile/customer/vehicles/${editingId}`,
          payload,
          session.access_token,
        );
      } else {
        await apiPost<{ vehicle: CustomerVehicle }>(
          "/api/mobile/customer/vehicles",
          {
            ...payload,
            isDefault: vehicles.length === 0,
          },
          session.access_token,
        );
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (vehicle: CustomerVehicle) => {
    if (!session?.access_token || vehicle.isDefault) return;
    setError(null);
    try {
      await apiPatch<{ vehicle: CustomerVehicle }>(
        `/api/mobile/customer/vehicles/${vehicle.id}`,
        { isDefault: true },
        session.access_token,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update vehicle");
    }
  };

  const handleDelete = (vehicle: CustomerVehicle) => {
    Alert.alert(
      "Remove vehicle?",
      `Remove ${vehicleTitle(vehicle)} from your garage?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!session?.access_token) return;
              setError(null);
              try {
                await apiDelete(
                  `/api/mobile/customer/vehicles/${vehicle.id}`,
                  session.access_token,
                );
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not remove vehicle");
              }
            })();
          },
        },
      ],
    );
  };

  if (authLoading || optionsLoading) {
    return <ActivityIndicator color="#f0c93a" className="py-8" />;
  }

  if (!session || !customer) {
    return (
      <View className="rounded-xl border border-border bg-card p-5">
        <Text className="text-center text-base font-semibold text-foreground">
          Save your vehicles
        </Text>
        <Text variant="muted" className="mb-4 mt-2 text-center text-sm leading-5">
          Sign in to add cars to your garage and pick them quickly when you book.
        </Text>
        <Button onPress={() => router.push("/login")}>Sign in</Button>
      </View>
    );
  }

  return (
    <View>
      {error ? (
        <Text variant="error" className="mb-3">
          {error}
        </Text>
      ) : null}

      {loading && !vehicles.length ? (
        <ActivityIndicator color="#f0c93a" className="py-6" />
      ) : vehicles.length ? (
        vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="mb-3">
            <CardHeader>
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <CardTitle>{vehicleTitle(vehicle)}</CardTitle>
                  <CardDescription>
                    {[vehicle.vehicleLabel, vehicle.vehicleInfo.trim()].filter(Boolean).join(" · ")}
                  </CardDescription>
                </View>
                {vehicle.isDefault ? <Badge label="Default" variant="secondary" /> : null}
              </View>
              <View className="mt-3 flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => startEdit(vehicle)}
                >
                  Edit
                </Button>
                {!vehicle.isDefault ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => void handleSetDefault(vehicle)}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => handleDelete(vehicle)}
                >
                  Remove
                </Button>
              </View>
            </CardHeader>
          </Card>
        ))
      ) : (
        <Text variant="muted" className="py-4 text-center">
          No vehicles saved yet. Add your first car below.
        </Text>
      )}

      {showForm ? (
        <View className="mt-4 rounded-xl border border-border bg-card p-4">
          <Text className="mb-3 text-base font-bold text-primary">
            {editingId ? "Edit vehicle" : "Add a vehicle"}
          </Text>

          <Text className="mb-2 text-sm font-semibold text-foreground">Vehicle type</Text>
          {vehicleOptions.map((option) => (
            <OptionRow
              key={option.key}
              title={option.label}
              subtitle={option.sub}
              selected={vehicleKey === option.key}
              onPress={() => setVehicleKey(option.key)}
            />
          ))}

          <View className="mt-3">
            <Label>Year, make, model, color</Label>
            <Input
              value={vehicleInfo}
              onChangeText={setVehicleInfo}
              placeholder="2024 Toyota Camry · White"
            />
          </View>

          <View className="mt-3">
            <Label>Nickname (optional)</Label>
            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder="Daily driver"
            />
          </View>

          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} disabled={saving} onPress={handleSave}>
              {editingId ? "Save changes" : "Save"}
            </Button>
          </View>
        </View>
      ) : (
        <Button className="mt-4" onPress={startAdd}>
          Add vehicle
        </Button>
      )}
    </View>
  );
}
