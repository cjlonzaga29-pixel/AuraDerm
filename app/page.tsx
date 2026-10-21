import { ScrollStage } from "@/components/scroll/ScrollStage";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/sections/Hero";
import { Collection } from "@/components/sections/Collection";
import { Editorial } from "@/components/sections/Editorial";
import { Statement } from "@/components/sections/Statement";
import { Spotlight } from "@/components/sections/Spotlight";
import { Ingredients } from "@/components/sections/Ingredients";
import { Routine } from "@/components/sections/Routine";
import { Questions } from "@/components/sections/Questions";
import { Closing } from "@/components/sections/Closing";
import { publicCheckoutStatus, resolveCheckoutConfig } from "@/lib/server/config";

export default function Home() {
  // Same availability check as /checkout, so the ordering answer matches it.
  const checkoutMode = publicCheckoutStatus(resolveCheckoutConfig()).mode;

  return (
    <>
      <ScrollStage
        hero1280Src="/stage/hero-1280.mp4"
        heroMobileSrc="/stage/hero-mobile.mp4"
        posterSrc="/stage/poster.webp"
      />
      <Nav />
      <main className="relative overflow-x-clip">
        <Hero />
        <Collection />
        <Editorial />
        <Statement />
        <Spotlight />
        <Ingredients />
        <Routine />
        <Questions checkoutMode={checkoutMode} />
        <Closing />
      </main>
    </>
  );
}
