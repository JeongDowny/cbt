import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-[var(--color-disabled-bg)] disabled:text-white ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:border-[var(--color-primary-strong)] hover:bg-[var(--color-primary-strong)]",
        secondary:
          "border-[var(--color-border-strong)] bg-[var(--color-secondary-bg)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-bg-hover)]",
        outline: "border-[var(--color-border-strong)] bg-white text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
        ghost: "border-transparent bg-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
