export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
    >
      Skip to content
    </a>
  );
}
