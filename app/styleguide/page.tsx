import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { LeafDivider } from "@/components/ui/LeafDivider";
import { colorTokens, radiusTokens } from "@/lib/tokens";

export default function StyleguidePage() {
  return (
    <main className="flex flex-1 flex-col gap-16 py-16">
      <Container className="flex flex-col gap-4">
        <Eyebrow withRule>Style guide</Eyebrow>
        <DisplayHeading level="h1" accent="Style">
          Style guide
        </DisplayHeading>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Tokens</DisplayHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div
                className="h-16 rounded-card border border-glass-border"
                style={{ backgroundColor: `var(${token.cssVar})` }}
              />
              <span className="font-sans text-xs text-cream">{token.name}</span>
              <span className="font-sans text-xs text-sage-muted">{token.value}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {radiusTokens.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div
                className="h-16 w-16 border border-glass-border bg-forest"
                style={{ borderRadius: `var(${token.cssVar})` }}
              />
              <span className="font-sans text-xs text-cream">{token.name}</span>
              <span className="font-sans text-xs text-sage-muted">{token.value}</span>
            </div>
          ))}
        </div>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Headings</DisplayHeading>
        <DisplayHeading level="h1" accent="botanicals">
          Displaying botanicals headline
        </DisplayHeading>
        <DisplayHeading level="h2" accent="ritual">
          A quiet ritual
        </DisplayHeading>
        <DisplayHeading level="h3">Card title, no accent</DisplayHeading>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Eyebrow</DisplayHeading>
        <Eyebrow>Plain eyebrow</Eyebrow>
        <Eyebrow withRule>Eyebrow with rule</Eyebrow>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Buttons</DisplayHeading>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text link</Button>
          <Button variant="primary" href="#">
            Primary link
          </Button>
        </div>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Glass panel</DisplayHeading>
        <GlassPanel className="p-8">
          <p className="font-sans text-sm text-cream">
            Panel content sits on a translucent fill with a hairline border.
          </p>
        </GlassPanel>
      </Container>

      <Container className="flex flex-col gap-6">
        <DisplayHeading level="h2">Leaf divider</DisplayHeading>
        <LeafDivider />
      </Container>
    </main>
  );
}
