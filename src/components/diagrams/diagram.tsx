import type { CaseStudyDiagram } from "@/content/types";
import { LifecycleDiagram } from "./lifecycle-diagram";
import { MigrationDiagram } from "./migration-diagram";
import { RbacDiagram } from "./rbac-diagram";

/** Renders the SVG for a diagram kind. Exhaustive: a new kind fails tsc here. */
export function Diagram({ diagram }: { diagram: CaseStudyDiagram }) {
  switch (diagram.kind) {
    case "rbac":
      return <RbacDiagram diagram={diagram} />;
    case "migration":
      return <MigrationDiagram diagram={diagram} />;
    case "lifecycle":
      return <LifecycleDiagram diagram={diagram} />;
    default: {
      const unreachable: never = diagram;
      return unreachable;
    }
  }
}
