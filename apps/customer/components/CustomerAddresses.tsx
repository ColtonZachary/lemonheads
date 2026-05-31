import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { CustomerAddress, CustomerAddressesResponse } from "@/lib/types";

function addressTitle(address: CustomerAddress): string {
  if (address.nickname.trim()) return address.nickname.trim();
  return address.formattedAddress;
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
  locationTypes: string[];
  onFormOpen?: () => void;
};

export function CustomerAddresses({ locationTypes, onFormOpen }: Props) {
  const router = useRouter();
  const { session, customer, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationType, setLocationType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [nickname, setNickname] = useState("");

  const saveableLocationTypes = useMemo(
    () => locationTypes.filter((type) => !type.includes("Drop off")),
    [locationTypes],
  );

  const load = useCallback(async () => {
    if (!session?.access_token || !customer) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiGet<CustomerAddressesResponse>(
        "/api/mobile/customer/addresses",
        session.access_token,
      );
      setAddresses(res.addresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load addresses");
    } finally {
      setLoading(false);
    }
  }, [customer, session?.access_token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!locationType && saveableLocationTypes.length) {
      setLocationType(saveableLocationTypes[0] ?? "");
    }
  }, [locationType, saveableLocationTypes]);

  const resetForm = () => {
    setEditingId(null);
    setAddress("");
    setCity("");
    setZip("");
    setNickname("");
    setLocationType(saveableLocationTypes[0] ?? "");
    setShowForm(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setAddress("");
    setCity("");
    setZip("");
    setNickname("");
    setLocationType(saveableLocationTypes[0] ?? "");
    setShowForm(true);
    onFormOpen?.();
  };

  const startEdit = (saved: CustomerAddress) => {
    setEditingId(saved.id);
    setLocationType(saved.locationType);
    setAddress(saved.address);
    setCity(saved.city);
    setZip(saved.zip);
    setNickname(saved.nickname);
    setShowForm(true);
    onFormOpen?.();
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!locationType) {
      setError("Select a location type");
      return;
    }
    if (!address.trim()) {
      setError("Enter your street address");
      return;
    }
    if (!city.trim()) {
      setError("Enter your city");
      return;
    }
    if (!zip.trim()) {
      setError("Enter your ZIP code");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        locationType,
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
        nickname: nickname.trim(),
      };

      if (editingId) {
        await apiPatch<{ address: CustomerAddress }>(
          `/api/mobile/customer/addresses/${editingId}`,
          payload,
          session.access_token,
        );
      } else {
        await apiPost<{ address: CustomerAddress }>(
          "/api/mobile/customer/addresses",
          {
            ...payload,
            isDefault: addresses.length === 0,
          },
          session.access_token,
        );
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (saved: CustomerAddress) => {
    if (!session?.access_token || saved.isDefault) return;
    setError(null);
    try {
      await apiPatch<{ address: CustomerAddress }>(
        `/api/mobile/customer/addresses/${saved.id}`,
        { isDefault: true },
        session.access_token,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update address");
    }
  };

  const handleDelete = (saved: CustomerAddress) => {
    Alert.alert(
      "Remove address?",
      `Remove ${addressTitle(saved)} from your saved addresses?`,
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
                  `/api/mobile/customer/addresses/${saved.id}`,
                  session.access_token,
                );
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not remove address");
              }
            })();
          },
        },
      ],
    );
  };

  if (authLoading) {
    return <ActivityIndicator color="#f0c93a" className="py-8" />;
  }

  if (!session || !customer) {
    return (
      <View className="rounded-xl border border-border bg-card p-5">
        <Text className="text-center text-base font-semibold text-foreground">
          Save your addresses
        </Text>
        <Text variant="muted" className="mb-4 mt-2 text-center text-sm leading-5">
          Sign in to save home and work addresses and pick them quickly when you book.
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

      {loading && !addresses.length ? (
        <ActivityIndicator color="#f0c93a" className="py-6" />
      ) : addresses.length ? (
        addresses.map((saved) => (
          <Card key={saved.id} className="mb-3">
            <CardHeader>
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <CardTitle>{addressTitle(saved)}</CardTitle>
                  <CardDescription>
                    {saved.locationType}
                    {saved.nickname.trim() ? ` · ${saved.formattedAddress}` : ""}
                  </CardDescription>
                </View>
                {saved.isDefault ? <Badge label="Default" variant="secondary" /> : null}
              </View>
              <View className="mt-3 flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => startEdit(saved)}
                >
                  Edit
                </Button>
                {!saved.isDefault ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => void handleSetDefault(saved)}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => handleDelete(saved)}
                >
                  Remove
                </Button>
              </View>
            </CardHeader>
          </Card>
        ))
      ) : (
        <Text variant="muted" className="py-4 text-center">
          No addresses saved yet. Add your first address below.
        </Text>
      )}

      {showForm ? (
        <View className="mt-4 rounded-xl border border-border bg-card p-4">
          <Text className="mb-3 text-base font-bold text-primary">
            {editingId ? "Edit address" : "Add an address"}
          </Text>

          <Text className="mb-2 text-sm font-semibold text-foreground">Location type</Text>
          {saveableLocationTypes.map((type) => (
            <OptionRow
              key={type}
              title={type}
              selected={locationType === type}
              onPress={() => setLocationType(type)}
            />
          ))}

          <View className="mt-3">
            <Label>Street address</Label>
            <Input value={address} onChangeText={setAddress} placeholder="123 Main St" />
          </View>

          <View className="mt-3">
            <Label>City</Label>
            <Input value={city} onChangeText={setCity} placeholder="Edmond" />
          </View>

          <View className="mt-3">
            <Label>ZIP code</Label>
            <Input value={zip} onChangeText={setZip} keyboardType="number-pad" placeholder="73013" />
          </View>

          <View className="mt-3">
            <Label>Nickname (optional)</Label>
            <Input value={nickname} onChangeText={setNickname} placeholder="Home" />
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
          Add address
        </Button>
      )}
    </View>
  );
}
