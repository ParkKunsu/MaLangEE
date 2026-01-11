import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
        outline: "border border-border bg-background hover:bg-accent rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        brand: "bg-brand text-brand-foreground hover:bg-brand/90 rounded-full",
        "brand-outline":
          "border-2 border-brand bg-background text-brand hover:bg-brand-muted rounded-full",
        primary:
          "bg-[#7666f5] text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] hover:bg-[#6758e8] focus-visible:ring-[#7B6CF6] rounded-full",
        "outline-purple":
          "border-2 border-[#7B6CF6] bg-white text-[#7B6CF6] hover:bg-[#f6f4ff] focus-visible:ring-[#7B6CF6] rounded-full",
        secondary:
          "bg-[#D4CCFF] text-[#5F51D9] hover:bg-[#C9BFFF] focus-visible:ring-[#5F51D9] rounded-full",
        solid: "bg-[#5F51D9] text-white shadow-lg hover:bg-[#4a3ec4] focus-visible:ring-[#5F51D9] rounded-full",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-[40px] px-4 text-sm",
        md: "h-[48px] px-6 text-base",
        lg: "h-[56px] px-6 text-base",
        xl: "h-[64px] px-8 text-lg",
        auto: "px-4 py-2 text-[10px]",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, isLoading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

