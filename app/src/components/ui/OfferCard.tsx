import { Badge } from "./Badge";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export interface OfferCardProps {
  id: string;
  title: string;
  description: string;
  restaurant: string;
  discount: string;
  expiresIn: string;
  pointsCost?: number;
  image?: string;
  type: "promo" | "points" | "flash";
  onClaim?: (id: string) => void;
  className?: string;
}

const typeConfig = {
  promo:  { label: "Promo",      variant: "accent"   as const },
  points: { label: "Fidélité",   variant: "success"  as const },
  flash:  { label: "Flash ⚡",   variant: "warning"  as const },
};

export function OfferCard({
  id, title, description, restaurant, discount,
  expiresIn, pointsCost, image, type, onClaim, className,
}: OfferCardProps) {
  const config = typeConfig[type];

  return (
    <div className={cn(
      "card p-0 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5",
      type === "flash" && "border-warning/40",
      className,
    )}>
      {/* Header band */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        type === "promo"  && "bg-accent-soft",
        type === "points" && "bg-success-soft",
        type === "flash"  && "bg-warning-soft",
      )}>
        <div className="flex items-center gap-2">
          {image ? (
            <img src={image} alt={restaurant} className="w-8 h-8 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-sm font-bold text-text-2">
              {restaurant[0]}
            </div>
          )}
          <span className="text-xs font-semibold text-text-2">{restaurant}</span>
        </div>
        <Badge variant={config.variant} size="sm">{config.label}</Badge>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-text text-sm leading-snug">{title}</h4>
          <span className="text-lg font-black text-accent shrink-0">{discount}</span>
        </div>
        <p className="text-xs text-text-3 leading-relaxed">{description}</p>

        {pointsCost && (
          <div className="flex items-center gap-1.5 text-xs text-text-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E85D26" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>{pointsCost.toLocaleString()} points requis</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-text-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          Expire {expiresIn}
        </div>
        <Button size="sm" variant={type === "flash" ? "primary" : "accent"} onClick={() => onClaim?.(id)}>
          {pointsCost ? "Échanger" : "Utiliser"}
        </Button>
      </div>
    </div>
  );
}
