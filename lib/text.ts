/**
 * The text split into code points, so an emoji such as 🎉 counts as one
 * character. Length limits and excerpts count characters this way on both the
 * client and the server.
 */
export function codePoints(text: string) {
  return Array.from(text);
}
