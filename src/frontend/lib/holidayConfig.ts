// Shared between the client-side BroadcastComposer's Holiday toggle (input
// max) and the server-side gymCalendar.ts (actual validation) — kept here,
// not in gymCalendar.ts, since that file is server-only and can't be
// imported from a client component.
export const MAX_HOLIDAY_DAYS = 5;
