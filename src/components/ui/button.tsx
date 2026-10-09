import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";

const base =
  "group inline-flex items-center gap-2 rounded-[10px] border px-5 py-3 text-[15px] font-medium transition-[transform,box-shadow,color,border-color] duration-300 ease-spring";

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-accent text-on-accent shadow-[0_8px_30px_-10px_var(--accent)]",
  secondary:
    "border-line bg-surface/70 text-text backdrop-blur-sm hover:border-line-strong",
};

function Arrow({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="transition-transform duration-300 ease-spring group-hover:translate-x-1"
    >
      {children}
    </span>
  );
}

export function buttonClass(variant: Variant = "primary") {
  return `${base} ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  arrow,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; arrow?: string }) {
  return (
    <button type="button" className={buttonClass(variant)} {...props}>
      {children}
      {arrow ? <Arrow>{arrow}</Arrow> : null}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  arrow,
  children,
  ...props
}: ComponentProps<"a"> & { variant?: Variant; arrow?: string }) {
  return (
    <a className={buttonClass(variant)} {...props}>
      {children}
      {arrow ? <Arrow>{arrow}</Arrow> : null}
    </a>
  );
}
