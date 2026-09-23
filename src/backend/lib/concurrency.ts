import "server-only";

// Runs `fn` over `items` with at most `limit` in flight at once. Used
// wherever a loop sends a WhatsApp/email/push to every member in a list
// (broadcasts, birthday/fee-reminder crons, trial reminders, auto-block) —
// doing that one-by-one meant N members took N sequential network
// round-trips, which for a few hundred members risked the serverless
// function's timeout killing the request partway through with no way to
// resume (the admin broadcast especially — "all" could be ~400 recipients).
// A worker-pool of a handful of concurrent sends finishes in a fraction of
// the time without hammering the WhatsApp Cloud API / Resend with hundreds
// of simultaneous requests at once, which real-world rate limits wouldn't
// tolerate either.
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
