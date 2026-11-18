import { unstable_rethrow } from "next/navigation";
import { countPendingIncoming } from "../connections";
import { getViewer } from "../profiles";

/** How many requests are waiting for the signed-in student. Hidden at 0, with no "seen" state. */
export default async function PendingRequestsBadge() {
  let count = 0;
  try {
    const viewer = await getViewer();
    if (viewer) count = await countPendingIncoming(viewer);
  } catch (error) {
    unstable_rethrow(error);
    // The badge is a hint: a failure leaves it hidden instead of breaking every page.
    console.error("Counting pending Connection Requests failed", { error });
  }
  if (!count) return null;
  return (
    <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 font-display text-xs leading-none font-semibold text-white tabular-nums">
      {count}<span className="sr-only"> pending connection {count === 1 ? "request" : "requests"}</span>
    </span>
  );
}
