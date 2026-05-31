import { TextInput, type TextInputProps } from "react-native";

import { cn } from "../../lib/utils";

export type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, placeholderTextColor = "#888888", ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        "h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground",
        className,
      )}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}
