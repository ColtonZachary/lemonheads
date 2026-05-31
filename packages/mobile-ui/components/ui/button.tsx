import { cva, type VariantProps } from "class-variance-authority";
import { ActivityIndicator, Pressable, type PressableProps } from "react-native";

import { cn } from "../../lib/utils";
import { Text as UiText } from "./text";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg active:opacity-90 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        outline: "border border-primary bg-transparent",
        secondary: "bg-secondary",
        ghost: "bg-white/5 border border-border",
        destructive: "bg-destructive/15",
        link: "bg-transparent",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-9 px-3",
        lg: "h-14 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("font-semibold text-center", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      primary: "text-primary-foreground",
      outline: "text-primary",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground/80",
      destructive: "text-destructive",
      link: "text-primary underline",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    loading?: boolean;
    textClassName?: string;
  };

export function Button({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  textClassName,
  ...props
}: ButtonProps) {
  const busy = loading || disabled;

  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={busy}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#f0c93a" : "#080808"} />
      ) : typeof children === "string" ? (
        <UiText className={cn(buttonTextVariants({ variant, size }), textClassName)}>
          {children}
        </UiText>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { buttonVariants };
