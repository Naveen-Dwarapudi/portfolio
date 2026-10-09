/**
 * Props for a link that opens in a new tab. The visible text stays as is;
 * screen readers also hear `label` (e.g. "(opens in a new tab)").
 */
export function newTabProps(label: string | undefined) {
  return label ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
