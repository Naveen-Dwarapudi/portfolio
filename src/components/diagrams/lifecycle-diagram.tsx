import type { LifecycleDiagram as LifecycleDiagramData } from "@/content/types";

/** Ticket lifecycle behind JWT + role checks. Parts carry dg-s1…dg-s5. */
export function LifecycleDiagram({
  diagram,
}: {
  diagram: LifecycleDiagramData;
}) {
  const l = diagram.labels;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={diagram.ariaLabel}
      className="dg-svg"
    >
      <g className="dg-part dg-s1">
        <rect
          className="dg-box dg-hot"
          x="24"
          y="30"
          width="592"
          height="52"
          rx="12"
        />
        <text className="dg-t" x="320" y="54" textAnchor="middle">
          {l.auth}
        </text>
        <text className="dg-s" x="320" y="72" textAnchor="middle">
          {l.authNote}
        </text>
        <rect
          className="dg-lane"
          x="24"
          y="104"
          width="592"
          height="270"
          rx="14"
        />
        <text className="dg-s" x="44" y="134">
          {l.lifecycle}
        </text>
      </g>
      <g className="dg-part dg-s2">
        <rect
          className="dg-box"
          x="44"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="96" y="197" textAnchor="middle">
          {l.created}
        </text>
        <rect
          className="dg-box"
          x="190"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="242" y="197" textAnchor="middle">
          {l.assigned}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M148 192 L 190 192"
      />
      <g className="dg-part dg-s3">
        <text className="dg-s" x="394" y="152" textAnchor="middle">
          {l.tracked}
        </text>
        <rect
          className="dg-box dg-hot"
          x="336"
          y="164"
          width="116"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="394" y="197" textAnchor="middle">
          {l.inProgress}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s3"
        pathLength={1}
        d="M294 192 L 336 192"
      />
      <g className="dg-part dg-s4">
        <rect
          className="dg-box"
          x="336"
          y="290"
          width="116"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="394" y="323" textAnchor="middle">
          {l.escalated}
        </text>
        <path
          className="dg-wire dg-dash"
          d="M372 220 C 360 252, 360 262, 372 290"
        />
        <path
          className="dg-wire dg-dash"
          d="M416 290 C 428 262, 428 252, 416 220"
        />
      </g>
      <g className="dg-part dg-s5">
        <rect
          className="dg-box dg-hot"
          x="494"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="546" y="197" textAnchor="middle">
          {l.resolved}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s5"
        pathLength={1}
        d="M452 192 L 494 192"
      />
    </svg>
  );
}
