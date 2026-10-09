import type { ComponentProps } from "react";

export function TextLink({ className = "", ...props }: ComponentProps<"a">) {
  return (
    <a
      className={`text-accent underline underline-offset-[3px] transition-colors hover:text-text ${className}`}
      {...props}
    />
  );
}
