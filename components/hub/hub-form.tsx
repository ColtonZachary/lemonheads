import type { ComponentProps, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function HubFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/80 bg-card/40", className)}>
      <CardHeader className="gap-1 pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="font-mono text-[9px] uppercase tracking-[0.1em]">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-4">{children}</FieldGroup>
      </CardContent>
    </Card>
  );
}

export function HubFieldLabel({
  className,
  ...props
}: ComponentProps<typeof FieldLabel>) {
  return (
    <FieldLabel
      className={cn(
        "font-mono text-[9px] font-normal uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function HubInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn("font-mono text-sm", className)} {...props} />;
}

export function HubTextarea({
  className,
  ...props
}: ComponentProps<typeof Textarea>) {
  return (
    <Textarea className={cn("min-h-20 font-mono text-sm", className)} {...props} />
  );
}

const nativeSelectClass =
  "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 font-mono text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export function HubNativeSelect({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select className={cn(nativeSelectClass, className)} {...props}>
      {children}
    </select>
  );
}

export function HubFieldRow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 @md/field-group:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HubCheckboxField({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <FieldSet className={className}>
      <FieldLegend variant="label" className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {legend}
      </FieldLegend>
      <div className="flex flex-col gap-2">{children}</div>
    </FieldSet>
  );
}

export function HubFormField({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field className={cn("min-w-0", className)}>
      <HubFieldLabel htmlFor={htmlFor}>
        {label}
        {required ? " *" : ""}
      </HubFieldLabel>
      {children}
    </Field>
  );
}

export { Field, FieldGroup };
