import { ScrollStage } from "@/components/scroll/ScrollStage";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { Collection } from "@/components/sections/Collection";
import { Ingredients } from "@/components/sections/Ingredients";
import { Routine } from "@/components/sections/Routine";
import { Closing } from "@/components/sections/Closing";

export default function Home() {
  return (
    <>
      <ScrollStage
        hero1280Src="/stage/hero-1280.mp4"
        hero720Src="/stage/hero-720.mp4"
        posterSrc="/stage/poster.webp"
      />
      <Nav />
      <main className="relative overflow-x-clip">
        <Hero />
        <Statement />
        <Collection />
        <Ingredients />
        <Routine />
        <Closing />
      </main>
    </>
  );
}
