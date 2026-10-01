import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";
import { INGREDIENT_ILLUSTRATIONS } from "@/components/illustrations";

export function Ingredients() {
  const { ingredientsPanel, ingredients } = site;

  return (
    <section id="ingredients" className="py-24">
      <Container>
        <Reveal>
          <GlassPanel className="flex flex-col gap-10 p-8 lg:p-12">
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-center lg:gap-8">
              <Eyebrow className="hidden lg:block">{ingredientsPanel.sideLabelLeft}</Eyebrow>
              <DisplayHeading level="h2" className="text-center">
                {ingredientsPanel.title}
              </DisplayHeading>
              <Eyebrow className="hidden lg:block">{ingredientsPanel.sideLabelRight}</Eyebrow>
            </div>

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-6">
              {ingredients.map((ingredient) => {
                const Illustration = INGREDIENT_ILLUSTRATIONS[ingredient.word];
                return (
                <div
                  key={ingredient.order}
                  className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3"
                >
                  <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-card border border-glass-border bg-glass-solid lg:h-24 lg:w-full">
                    {Illustration ? (
                      <Illustration
                        title={`${ingredient.name} botanical illustration`}
                        className="h-full w-full p-1.5"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted">
                      {String(ingredient.order).padStart(2, "0")} / {ingredient.word}
                    </span>
                    <span className="font-display text-lg text-cream">{ingredient.name}</span>
                    <span className="font-sans text-sm text-sage-muted">
                      {ingredient.benefit}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </GlassPanel>
        </Reveal>
      </Container>
    </section>
  );
}
