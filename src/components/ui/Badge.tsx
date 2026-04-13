import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center font-body font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-cream-dark text-ink-light",
        forest:
          "bg-forest text-cream",
        rust:
          "bg-rust text-white",
        outline:
          "border border-border bg-transparent text-ink-light",
      },
      size: {
        sm: "rounded-full px-2 py-0.5 text-xs",
        md: "rounded-full px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant,
  size,
  className,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))}>
      {children}
    </span>
  );
}

export { badgeVariants };
