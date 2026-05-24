export function isSupabaseMissingColumn(
  error: { message?: string; code?: string } | null | undefined,
  column: string,
): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  const col = column.toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes(`'${col}'`) ||
    message.includes(col)
  );
}
