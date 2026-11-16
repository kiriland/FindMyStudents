/**
 * Rules for the Profile fields a student edits. Shared by the server, which
 * enforces them, and the edit form, which shows them as the student types.
 */

export const BIO_MAX_LENGTH = 1000;

/** A bio as it is stored: plain text with `\n` line breaks, no outer whitespace. */
export function normalizeBio(raw: string) {
  // Browsers submit textarea line breaks as CRLF.
  return raw.replace(/\r\n?/g, "\n").trim();
}

/** Length in characters (code points), so an emoji counts once. */
export function bioLength(bio: string) {
  return Array.from(normalizeBio(bio)).length;
}

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseBio(raw: string): FieldResult<string> {
  const bio = normalizeBio(raw);
  if (Array.from(bio).length > BIO_MAX_LENGTH) {
    return { ok: false, error: `Keep your bio to ${BIO_MAX_LENGTH} characters or fewer.` };
  }
  return { ok: true, value: bio };
}
