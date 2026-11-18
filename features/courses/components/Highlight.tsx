/** The words of a search, normalised the way the catalogue search reads them. */
export function searchWords(search: string) {
  return search
    .toLowerCase()
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 1);
}

/** `text` with each search word marked, so matches stand out in results. */
export default function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, index) =>
    index % 2 ? <mark key={index} className="rounded-[3px] bg-brand-100 px-px text-inherit">{part}</mark> : part,
  );
}
