import "server-only";

// Email addresses are case-insensitive in practice (RFC 5321 technically
// leaves the local part case-sensitive, but no real provider — Gmail,
// Outlook, etc. — treats it that way). Without normalizing, "John@Gmail.com"
// at signup and "john@gmail.com" at login are different strings to every
// .eq("email", ...) lookup this app does, so a member could lock
// themselves out of email-based login purely by how they capitalized it
// one time versus another.
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
