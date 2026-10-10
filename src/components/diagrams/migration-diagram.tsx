import type { MigrationDiagram as MigrationDiagramData } from "@/content/types";

/** Ionic (WebView) → React Native (native UI). Parts carry dg-s1…dg-s4. */
export function MigrationDiagram({
  diagram,
}: {
  diagram: MigrationDiagramData;
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
        <text className="dg-s" x="150" y="26" textAnchor="middle">
          {l.before}
        </text>
        <rect
          className="dg-box"
          x="24"
          y="44"
          width="252"
          height="300"
          rx="16"
        />
        <text className="dg-s" x="40" y="68">
          {l.shell}
        </text>
        <rect
          className="dg-box"
          x="44"
          y="84"
          width="212"
          height="170"
          rx="12"
        />
        <text className="dg-s" x="60" y="106">
          {l.webview}
        </text>
        <rect
          className="dg-box"
          x="64"
          y="120"
          width="172"
          height="112"
          rx="10"
        />
        <text className="dg-t" x="150" y="170" textAnchor="middle">
          {l.webCode}
        </text>
        <text className="dg-s" x="150" y="192" textAnchor="middle">
          {l.webUi}
        </text>
        <text className="dg-s" x="150" y="290" textAnchor="middle">
          {l.plugins}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s2"
        pathLength={1}
        d="M288 194 L 352 194"
      />
      <g className="dg-part dg-s2">
        <polygon className="dg-arrow-hot" points="352,186 366,194 352,202" />
        <text className="dg-s" x="497" y="26" textAnchor="middle">
          {l.after}
        </text>
        <rect
          className="dg-box dg-hot"
          x="378"
          y="44"
          width="238"
          height="70"
          rx="12"
        />
        <text className="dg-t" x="497" y="74" textAnchor="middle">
          {l.rn}
        </text>
        <text className="dg-s" x="497" y="96" textAnchor="middle">
          {l.rnState}
        </text>
        <rect
          className="dg-box dg-hot"
          x="378"
          y="150"
          width="238"
          height="70"
          rx="12"
        />
        <text className="dg-t" x="497" y="180" textAnchor="middle">
          {l.nativeUi}
        </text>
        <text className="dg-s" x="497" y="202" textAnchor="middle">
          {l.platforms}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s2"
        pathLength={1}
        d="M497 114 L 497 150"
      />
      <g className="dg-part dg-s3">
        <rect
          className="dg-box"
          x="378"
          y="250"
          width="112"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="434" y="275" textAnchor="middle">
          {l.scanning}
        </text>
        <text className="dg-s" x="434" y="294" textAnchor="middle">
          {l.scanningNote}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s3"
        pathLength={1}
        d="M434 250 L 434 220"
      />
      <g className="dg-part dg-s4">
        <rect
          className="dg-box"
          x="504"
          y="250"
          width="112"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="560" y="275" textAnchor="middle">
          {l.monitoring}
        </text>
        <text className="dg-s" x="560" y="294" textAnchor="middle">
          {l.monitoringNote}
        </text>
        <rect
          className="dg-box"
          x="378"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="414" y="342" textAnchor="middle">
          {l.dev}
        </text>
        <rect
          className="dg-box"
          x="461"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="497" y="342" textAnchor="middle">
          {l.staging}
        </text>
        <rect
          className="dg-box"
          x="544"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="580" y="342" textAnchor="middle">
          {l.prod}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s4"
        pathLength={1}
        d="M560 250 L 560 220"
      />
    </svg>
  );
}
