import { CleanseConcept, FinishConcept, HydrateConcept } from "@/components/illustrations";
import type { ConceptVisual } from "@/lib/catalog";

const CONCEPT_ART = {
  cleanse: CleanseConcept,
  hydrate: HydrateConcept,
  finish: FinishConcept,
} satisfies Record<ConceptVisual, unknown>;

// There is no product photography yet, so every product is shown as a
// labelled concept illustration — never presented as a photo of the bottle.
export function ProductVisual({
  concept,
  name,
  className,
}: {
  concept: ConceptVisual;
  name: string;
  className?: string;
}) {
  const Art = CONCEPT_ART[concept];
  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-card border border-hairline bg-forest ${className ?? ""}`}
    >
      <Art title={`Concept illustration for ${name}`} className="size-full" />
      <span className="absolute bottom-3 left-3 rounded-full bg-forest-deep/80 px-3 py-1 font-sans text-[0.6875rem] tracking-wide text-sage-muted">
        Concept illustration
      </span>
    </div>
  );
}
