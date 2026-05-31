import { forwardRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";

import { cn } from "../../lib/utils";

export function Screen({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("flex-1 bg-background", className)} {...props} />;
}

export const ScreenScroll = forwardRef<
  ScrollView,
  ScrollViewProps & {
    className?: string;
    contentContainerClassName?: string;
    keyboardAvoiding?: boolean;
    keyboardVerticalOffset?: number;
  }
>(function ScreenScroll(
  {
    className,
    contentContainerClassName,
    keyboardAvoiding = false,
    keyboardVerticalOffset = 0,
    ...props
  },
  ref,
) {
  const scrollView = (
    <ScrollView
      ref={ref}
      className={cn("flex-1 bg-background", className)}
      contentContainerClassName={cn("p-4 pb-8", contentContainerClassName)}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      {...props}
    />
  );

  if (!keyboardAvoiding) {
    return scrollView;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollView}
    </KeyboardAvoidingView>
  );
});

export function ScreenCenter({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("flex-1 items-center justify-center bg-background px-6", className)}
      {...props}
    />
  );
}
