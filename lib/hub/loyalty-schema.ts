/** PostgREST has not picked up new loyalty tables/functions yet. */
export function isLoyaltySchemaCacheError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("could not find the table") ||
    lower.includes("could not find the function")
  );
}

export function logLoyaltyDbIssue(scope: string, message: string): void {
  if (isLoyaltySchemaCacheError(message)) return;
  console.error(`[loyalty] ${scope}:`, message);
}
