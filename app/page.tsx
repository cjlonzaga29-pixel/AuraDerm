import { ScrollStage } from "@/components/scroll/ScrollStage";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { Ingredients } from "@/components/sections/Ingredients";
import { Benefits } from "@/components/sections/Benefits";
import { Actives } from "@/components/sections/Actives";
import { Routine } from "@/components/sections/Routine";
import { GivesBack } from "@/components/sections/GivesBack";
import { LeafDivider } from "@/components/ui/LeafDivider";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";

export default function Home() {
  return (
    <>
      <ScrollStage
        hero1280Src="/stage/hero-1280.mp4"
        hero720Src="/stage/hero-720.mp4"
        posterSrc="/stage/poster.webp"
      />
      <Nav />
      <main className="relative">
        <Hero />
        <Statement />
        <Ingredients />
        <Container>
          <LeafDivider />
        </Container>
        <Benefits />
        <Actives />
        <Routine />
        <GivesBack headline={site.givesBackHeadline} items={site.sustainability} />
      </main>
    </>
  );
}
