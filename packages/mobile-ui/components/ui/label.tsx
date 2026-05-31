import { Text, type TextProps } from "react-native";

import { cn } from "../../lib/utils";

export function Label({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text className={cn("mb-1.5 text-sm font-medium text-muted-foreground", className)} {...props} />
  );
}
