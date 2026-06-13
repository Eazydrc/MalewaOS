import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
  sm:   "rounded",
  md:   "rounded-lg",
  lg:   "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ width, height, rounded = "md", className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", roundedClasses[rounded], className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden p-0">
      <Skeleton height={176} rounded="sm" className="rounded-none rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton width={130} height={16} />
          <Skeleton width={40} height={16} />
        </div>
        <Skeleton width={90} height={12} />
        <div className="flex gap-1.5">
          <Skeleton width={56} height={20} rounded="full" />
          <Skeleton width={56} height={20} rounded="full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Skeleton width={64} height={12} />
          <Skeleton width={80} height={32} rounded="lg" />
        </div>
      </div>
    </div>
  );
}
