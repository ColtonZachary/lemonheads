import { cva, type VariantProps } from "class-variance-authority";
import { Text, View, type ViewProps } from "react-native";

import { cn } from "../../lib/utils";

const badgeVariants = cva("self-start rounded-md px-2 py-0.5", {
  variants: {
    variant: {
      default: "bg-primary/20",
      secondary: "bg-secondary",
      outline: "border border-border bg-transparent",
      destructive: "bg-destructive/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const badgeTextVariants = cva("text-xs font-semibold uppercase tracking-wide", {
  variants: {
    variant: {
      default: "text-primary",
      secondary: "text-secondary-foreground",
      outline: "text-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants> & {
    label: string;
    className?: string;
  };

export function Badge({ label, variant, className, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={badgeTextVariants({ variant })}>{label}</Text>
    </View>
  );
}
