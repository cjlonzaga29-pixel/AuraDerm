import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        primary:
          "bg-forest text-cream hover:bg-forest-deep shadow-sm tracking-wide uppercase font-jost text-xs font-semibold px-6 py-3 rounded-full transition-all",
        secondary:
          "bg-gold text-cream hover:bg-gold-deep shadow-sm tracking-wide uppercase font-jost text-xs font-semibold px-6 py-3 rounded-full transition-all",
        botanical:
          "bg-forest text-cream hover:bg-forest-deep border border-forest/30 tracking-wider uppercase font-jost text-xs font-semibold px-6 py-3 rounded-full transition-all",
        gold:
          "bg-gold text-cream hover:bg-gold-deep tracking-wider uppercase font-jost text-xs font-semibold px-6 py-3 rounded-full transition-all",
        glass:
          "bg-white/10 backdrop-blur-md text-forest-deep border border-white/20 hover:bg-white/20 font-jost rounded-full px-6 py-3 transition-all",
        text:
          "text-forest underline-offset-4 hover:underline font-jost tracking-wide uppercase text-xs font-semibold p-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  href?: string;
  anchorProps?: Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant, size, asChild = false, href, anchorProps, ...props }, ref) => {
    if (href) {
      return (
        <a
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...anchorProps}
        >
          {props.children}
        </a>
      );
    }

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
