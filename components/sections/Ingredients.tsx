import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { site } from "@/content/site";

// Three wide botanical tiles, each linking to the products whose label lists
// that ingredient. Open composition — image over caption, no surrounding panel.
export function Ingredients() {
  const { ingredientsIntro, ingredients, products } = site;

  return (
    <section id="ingredients" className="py-8 lg:py-12">
      <Container className="flex flex-col gap-8 lg:gap-10">
        <div className="text-scrim flex max-w-xl flex-col gap-3 self-start">
          <DisplayHeading level="h2">{ingredientsIntro.headline}</DisplayHeading>
          <p className="font-sans text-base leading-relaxed text-cream">{ingredientsIntro.note}</p>
        </div>

        <ul className="grid gap-10 md:grid-cols-3 md:gap-6">
          {ingredients.map((ingredient) => (
            <li key={ingredient.order} className="flex flex-col gap-5">
              <MediaSlot slot={ingredient.media} />
              <div className="text-scrim flex flex-col gap-1">
                <h3 className="font-heading text-2xl leading-tight font-medium text-cream">
                  {ingredient.name}
                </h3>
                <p className="font-sans text-base leading-relaxed text-cream">{ingredient.benefit}</p>
                <p className="font-sans text-base leading-relaxed text-sage-muted">
                  Found in{" "}
                  {ingredient.foundIn.map((slug, i) => {
                    const product = products.find((p) => p.slug === slug);
                    return (
                      <span key={slug}>
                        {i > 0 ? ", " : null}
                        <Link
                          href={`/shop/${slug}`}
                          className="text-cream underline underline-offset-4 hover:text-gold"
                        >
                          {product?.name.replace(/^Aura Derm /, "") ?? slug}
                        </Link>
                      </span>
                    );
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
