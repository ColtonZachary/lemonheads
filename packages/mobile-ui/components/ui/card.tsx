import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "../../lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("mb-2 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text className={cn("text-lg font-bold text-card-foreground", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: TextProps & { className?: string }) {
  return (
    <Text className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("mt-4 flex flex-row items-center border-t border-border pt-4", className)}
      {...props}
    />
  );
}
