"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";

type Labels = { idle: string; done: string; announced: string; failed: string };
type Status = "idle" | "done" | "failed";

/** Copies the email address; the mailto link beside it works without JS. */
export function CopyEmailButton({
  email,
  labels,
}: {
  email: string;
  labels: Labels;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "done") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={buttonClass("secondary")}>
        {status === "done" ? labels.done : labels.idle}
      </button>
      <span role="status" className="sr-only">
        {status === "done"
          ? labels.announced
          : status === "failed"
            ? labels.failed
            : ""}
      </span>
    </>
  );
}
