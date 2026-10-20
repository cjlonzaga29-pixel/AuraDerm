import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { site } from "@/content/site";
import { INGREDIENT_ILLUSTRATIONS } from "@/components/illustrations";

// The one wide panel on the page: five botanicals need the width. Items are
// plain columns divided by whitespace — no nested inset cards.
export function Ingredients() {
  const { ingredientsIntro, ingredients } = site;

  return (
    <section id="ingredients" className="py-24 lg:py-36">
      <Container>
        <GlassPanel className="flex flex-col gap-10 p-7 lg:p-12">
          <div className="flex max-w-lg flex-col gap-3">
            <DisplayHeading level="h2">{ingredientsIntro.headline}</DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">{ingredientsIntro.body}</p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {ingredients.map((ingredient) => {
              const Illustration = INGREDIENT_ILLUSTRATIONS[ingredient.word];
              return (
                <li key={ingredient.order} className="flex items-center gap-4 lg:flex-col lg:items-start">
                  {Illustration ? (
                    <Illustration
                      title={`${ingredient.name} botanical illustration`}
                      className="size-14 shrink-0 lg:size-16"
                    />
                  ) : null}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-base font-medium text-cream">{ingredient.name}</h3>
                    <p className="font-sans text-sm leading-relaxed text-sage-muted">
                      {ingredient.benefit}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassPanel>
      </Container>
    </section>
  );
}
