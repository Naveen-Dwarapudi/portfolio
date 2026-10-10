import type { RbacDiagram as RbacDiagramData } from "@/content/types";

/** Two-tier RBAC across three portals. Parts carry dg-s1…dg-s4 step classes. */
export function RbacDiagram({ diagram }: { diagram: RbacDiagramData }) {
  const l = diagram.labels;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={diagram.ariaLabel}
      className="dg-svg"
    >
      <g className="dg-part dg-s1">
        <text className="dg-s" x="85" y="22" textAnchor="middle">
          {l.who}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="38"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="65" textAnchor="middle">
          {l.superAdmin}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="110"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="137" textAnchor="middle">
          {l.limitedAdmin}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="214"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="241" textAnchor="middle">
          {l.staff}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="314"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="341" textAnchor="middle">
          {l.customer}
        </text>
      </g>
      <g className="dg-part dg-s1">
        <text className="dg-s" x="551" y="22" textAnchor="middle">
          {l.where}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="74"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="106" textAnchor="middle">
          {l.adminPortal}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="210"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="242" textAnchor="middle">
          {l.staffPortal}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="310"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="342" textAnchor="middle">
          {l.customerPortal}
        </text>
      </g>
      <g className="dg-part dg-s2">
        <text className="dg-s" x="319" y="22" textAnchor="middle">
          {l.how}
        </text>
        <rect
          className="dg-box dg-hot"
          x="236"
          y="150"
          width="166"
          height="96"
          rx="14"
        />
        <text className="dg-t" x="319" y="190" textAnchor="middle">
          {l.model}
        </text>
        <text className="dg-s" x="319" y="212" textAnchor="middle">
          {l.modelNote}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M154 236 C 200 236, 200 214, 236 214"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M154 336 C 210 336, 210 236, 236 236"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M402 220 C 440 220, 440 237, 478 237"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M402 236 C 450 236, 450 337, 478 337"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M154 60 C 200 60, 200 168, 236 168"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M154 132 C 196 132, 200 186, 236 186"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M402 172 C 440 172, 440 101, 478 101"
      />
      <g className="dg-part dg-s3">
        <rect
          className="dg-box dg-hot"
          x="252"
          y="70"
          width="134"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="319" y="93" textAnchor="middle">
          {l.tierAll}
        </text>
        <text className="dg-t" x="319" y="113" textAnchor="middle">
          {l.tierSubset}
        </text>
      </g>
      <g className="dg-part dg-s4">
        <path
          className="dg-wire dg-dash"
          d="M154 352 C 300 392, 420 392, 478 128"
        />
        <line className="dg-x" x1="354" y1="333" x2="376" y2="355" />
        <line className="dg-x" x1="376" y1="333" x2="354" y2="355" />
        <text className="dg-s" x="300" y="392" textAnchor="middle">
          {l.blocked}
        </text>
      </g>
    </svg>
  );
}
