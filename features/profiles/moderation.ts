import "server-only";
import { DetectModerationLabelsCommand, type ModerationLabel } from "@aws-sdk/client-rekognition";
import { rekognition } from "@/lib/rekognition";

/**
 * Picture moderation, used only by the Profiles module. A picture is blocked
 * when any Rekognition moderation label at or above the threshold falls under
 * one of the blocked top-level categories. There is no face check and no human
 * review.
 */

const DEFAULT_MIN_CONFIDENCE = 80;
/** Rekognition's top-level categories. "Swimwear or Underwear" and "Gambling" are allowed. */
const DEFAULT_BLOCKED_CATEGORIES = [
  "Explicit",
  "Non-Explicit Nudity of Intimate parts and Kissing",
  "Violence",
  "Visually Disturbing",
  "Hate Symbols",
  "Rude Gestures",
  "Drugs & Tobacco",
  "Alcohol",
];

type ModerationConfig = { minConfidence: number; blockedCategories: Set<string> };

/** The threshold (0–100) and the comma-separated categories, from env, falling back to the defaults. Categories are lowercased. */
function moderationConfig(): ModerationConfig {
  const rawMinConfidence = process.env.PICTURE_MODERATION_MIN_CONFIDENCE?.trim();
  const minConfidence = rawMinConfidence ? Number(rawMinConfidence) : DEFAULT_MIN_CONFIDENCE;
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 100) {
    throw new Error("PICTURE_MODERATION_MIN_CONFIDENCE must be a number from 0 to 100.");
  }
  const categories = (process.env.PICTURE_MODERATION_BLOCKED_CATEGORIES ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  // Case is ignored, so a variable typed in another case still blocks.
  const blocked = categories.length ? categories : DEFAULT_BLOCKED_CATEGORIES;
  return { minConfidence, blockedCategories: new Set(blocked.map((name) => name.toLowerCase())) };
}

/** A label's own name and those of all its ancestors, as far as the response shows them. */
function lineage(label: ModerationLabel, byName: Map<string, ModerationLabel>) {
  const names: string[] = [];
  let current: ModerationLabel | undefined = label;
  while (current?.Name && !names.includes(current.Name)) {
    names.push(current.Name);
    const parent: string | undefined = current.ParentName;
    if (!parent) break;
    current = byName.get(parent) ?? { Name: parent };
  }
  return names;
}

export type ModerationResult = { allowed: true } | { allowed: false; labels: string[] };

/** Checks a picture's bytes, returning the names of the labels that block it, if any. */
export async function moderatePicture(bytes: Uint8Array): Promise<ModerationResult> {
  const { minConfidence, blockedCategories } = moderationConfig();
  // Every label is requested, not just those above the threshold, so that each
  // label's parents are in the response and its top-level category is known.
  const { ModerationLabels: labels = [] } = await rekognition.send(new DetectModerationLabelsCommand({
    Image: { Bytes: bytes },
    MinConfidence: 0,
  }));
  const byName = new Map(labels.flatMap((label) => (label.Name ? [[label.Name, label] as const] : [])));
  const blocking = labels.filter((label) =>
    (label.Confidence ?? 0) >= minConfidence && lineage(label, byName).some((name) => blockedCategories.has(name.toLowerCase())));
  if (blocking.length === 0) return { allowed: true };
  return { allowed: false, labels: [...new Set(blocking.map((label) => label.Name!))] };
}
