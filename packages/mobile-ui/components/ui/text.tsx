import { cva, type VariantProps } from "class-variance-authority";
import { Text as RNText, type TextProps } from "react-native";

import { cn } from "../../lib/utils";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "text-base",
      muted: "text-sm text-muted-foreground",
      title: "text-2xl font-bold text-primary",
      subtitle: "text-sm uppercase tracking-widest text-muted-foreground",
      error: "text-sm text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type TextComponentProps = TextProps &
  VariantProps<typeof textVariants> & {
    className?: string;
  };

export function Text({ className, variant, ...props }: TextComponentProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
