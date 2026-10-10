import type { CaseStudyDiagram } from "@/content/types";
import { Diagram } from "./diagram";

/**
 * Sticky stage whose steps light up while the SVG assembles, driven only by
 * CSS scroll timelines (globals.css, "Case-study diagrams"). Without support,
 * with reduced motion, or below 1024px, everything is simply visible.
 */
export function ScrollDiagram({
  diagram,
  steps,
}: {
  diagram: CaseStudyDiagram;
  steps: string[];
}) {
  return (
    <div className="dg-stage-track">
      <div className="dg-stage">
        <div>
          <h3 className="font-display text-h3 font-extrabold tracking-[-0.02em] text-text">
            {diagram.title}
          </h3>
          {/* role="list": WebKit drops list semantics when list-style is none. */}
          <ol role="list" className="dg-steps mt-5">
            {steps.map((step, i) => (
              <li key={step} className={`dg-step dg-s${i + 1}`}>
                {step}
              </li>
            ))}
          </ol>
        </div>
        {/* Focusable: on phones the canvas scrolls sideways (keyboard access). */}
        <div
          className="dg-canvas"
          tabIndex={0}
          role="group"
          aria-label={diagram.title}
        >
          <Diagram diagram={diagram} />
        </div>
      </div>
    </div>
  );
}
