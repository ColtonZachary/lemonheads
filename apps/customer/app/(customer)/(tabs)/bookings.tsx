import { Redirect } from "expo-router";

export default function BookingsRedirect() {
  return <Redirect href="/(customer)/(tabs)/book" />;
}
