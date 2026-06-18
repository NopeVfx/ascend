import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "lime";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg border-accent hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]",
  lime: "bg-lime text-accent-fg border-lime hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]",
  outline:
    "bg-surface text-foreground border-border hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-foreground border-transparent hover:border-border",
  danger:
    "bg-transparent text-danger border-danger hover:bg-danger hover:text-accent-fg",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 border-2 font-bold uppercase-wide transition-all disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
