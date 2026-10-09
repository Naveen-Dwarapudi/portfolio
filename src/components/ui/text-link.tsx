import type { ComponentProps } from "react";
import { newTabProps } from "./new-tab";

export function TextLink({
  className = "",
  newTabLabel,
  children,
  ...props
}: ComponentProps<"a"> & {
  /** When set, opens in a new tab and appends this text for screen readers. */
  newTabLabel?: string;
}) {
  return (
    <a
      className={`text-accent underline underline-offset-[3px] transition-colors hover:text-text ${className}`}
      {...newTabProps(newTabLabel)}
      {...props}
    >
      {children}
      {newTabLabel ? <span className="sr-only"> {newTabLabel}</span> : null}
    </a>
  );
}
