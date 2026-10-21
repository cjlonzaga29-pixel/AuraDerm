import type { Metadata } from "next";
import { Bebas_Neue, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/site/Footer";
import { FooterGate } from "@/components/site/FooterGate";
import { CartProvider } from "@/context/CartContext";
import { CartSheet } from "@/components/store/CartSheet";

const displayFont = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Headline serif — consumed only by DisplayHeading via font-heading. Bebas
// (font-display) stays reserved for the AURADERM wordmark.
const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sansFont = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AuraDerm Botanicals",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${headingFont.variable} ${sansFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <FooterGate>
            <Footer />
          </FooterGate>
          <CartSheet />
        </CartProvider>
      </body>
    </html>
  );
}
