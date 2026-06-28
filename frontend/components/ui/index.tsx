"use client";

import { forwardRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ----------------------------- BUTTON ----------------------------- */

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "warm";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      type = "button",
      onClick,
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#bf9494] text-white hover:bg-[#a87d7d] focus:ring-[#bf9494] shadow-lg shadow-[#bf9494]/20",
      secondary:
        "bg-[#f5f0ef] text-[#2d2424] hover:bg-[#efe4e4] focus:ring-[#bf9494]",
      ghost:
        "text-[#8a6a6a] hover:bg-[#efe4e4] focus:ring-[#bf9494]",
      danger:
        "bg-red-400 text-white hover:bg-red-500 focus:ring-red-400",
      warm:
        "bg-[#2d2424] text-white hover:bg-[#4a3b3b] focus:ring-[#2d2424] shadow-lg shadow-[#2d2424]/15",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
      xl: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

/* ----------------------------- INPUT ----------------------------- */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[#2d2424]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bf9494]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-2xl border bg-white px-4 py-3.5 text-[#2d2424] placeholder-[#8c7b7b]/60 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#bf9494]/40 focus:border-[#bf9494]",
              "disabled:bg-[#f5f0ef] disabled:text-[#8c7b7b]",
              error
                ? "border-red-300 focus:ring-red-200"
                : "border-[#efe4e4]",
              icon ? "pl-11" : "",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="text-sm text-[#8c7b7b]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ----------------------------- SLIDER ----------------------------- */

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  hint,
}: SliderProps) {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#2d2424]">{label}</label>
        <span className="text-sm font-semibold text-[#8a6a6a] bg-[#efe4e4] px-3 py-1 rounded-full">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #bf9494 0%, #bf9494 ${percentage}%, #f5f0ef ${percentage}%, #f5f0ef 100%)`,
          }}
        />
      </div>
      {hint && <p className="text-xs text-[#8c7b7b]">{hint}</p>}
    </div>
  );
}

/* ----------------------------- CARD ----------------------------- */

interface CardProps {
  variant?: "default" | "glass" | "elevated" | "soft";
  children?: ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children }, ref) => {
    const variants = {
      default: "bg-white border border-[#efe4e4]",
      glass:
        "glass border border-white/40",
      elevated:
        "bg-white shadow-xl shadow-[#2d2424]/[0.04] border border-[#efe4e4]",
      soft: "bg-[#f5f0ef]",
    };

    return (
      <motion.div
        ref={ref}
        className={cn("rounded-3xl p-6 md:p-8", variants[variant], className)}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";

/* ----------------------------- BADGE ----------------------------- */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[#f5f0ef] text-[#8c7b7b]",
    primary: "bg-[#efe4e4] text-[#8a6a6a]",
    success: "bg-[#e8efe6] text-[#5a7352]",
    warning: "bg-[#f5f0e6] text-[#8a7a5a]",
    danger: "bg-[#f5e8e8] text-[#8a5a5a]",
    info: "bg-[#e8f0f5] text-[#5a6f8a]",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------- TABS ----------------------------- */

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1.5 bg-[#f5f0ef] rounded-2xl",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-xl transition-all",
            activeTab === tab.id
              ? "text-[#2d2424]"
              : "text-[#8c7b7b] hover:text-[#5a4a4a]"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-xl shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- PILL TABS ----------------------------- */

interface PillTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeTab, onChange, className }: PillTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-1 bg-white/60 backdrop-blur-sm border border-[#efe4e4] rounded-full",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-full transition-all",
            activeTab === tab.id
              ? "text-white"
              : "text-[#8c7b7b] hover:text-[#5a4a4a]"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="pillTab"
              className="absolute inset-0 bg-[#bf9494] rounded-full"
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- PROGRESS ----------------------------- */

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "gradient";
}

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  variant = "default",
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variants = {
    default: "bg-[#bf9494]",
    success: "bg-[#94a98c]",
    warning: "bg-[#c4a484]",
    gradient: "bg-gradient-to-r from-[#bf9494] to-[#d9baba]",
  };

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-[#8c7b7b]">{label}</span>}
          {showValue && (
            <span className="font-medium text-[#2d2424]">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-[#f5f0ef] rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", variants[variant])}
        />
      </div>
    </div>
  );
}

/* ----------------------------- SKELETON ----------------------------- */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#efe4e4] rounded-2xl",
        className
      )}
    />
  );
}

/* ----------------------------- TOOLTIP ----------------------------- */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2d2424] text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2d2424]" />
      </div>
    </div>
  );
}
