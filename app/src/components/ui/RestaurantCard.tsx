import { Badge } from "./Badge";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export interface RestaurantCardProps {
  id: string;
  name: string;
  cuisine: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  priceRange: 1 | 2 | 3;
  tags?: string[];
  isOpen?: boolean;
  hasOffer?: boolean;
  offerLabel?: string;
  onReserve?: (id: string) => void;
  className?: string;
}

function StarFilled() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function PriceRange({ value }: { value: 1 | 2 | 3 }) {
  return (
    <span className="text-xs font-semibold tracking-tight">
      <span className="text-text-2">{"$".repeat(value)}</span>
      <span className="text-border-strong">{"$".repeat(3 - value)}</span>
    </span>
  );
}

export function RestaurantCard({
  id, name, cuisine, image, rating, reviewCount,
  distance, priceRange, tags = [], isOpen = true,
  hasOffer, offerLabel, onReserve, className,
}: RestaurantCardProps) {
  return (
    <div className={cn(
      "card-hover overflow-hidden group cursor-pointer",
      className,
    )}>
      {/* Image */}
      <div className="relative h-44 bg-surface-2 overflow-hidden rounded-t-xl">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://placehold.co/400x176/F1F1F5/9999B0?text=${encodeURIComponent(name)}`;
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={isOpen ? "success" : "danger"} size="sm" dot>
            {isOpen ? "Ouvert" : "Fermé"}
          </Badge>
          {hasOffer && offerLabel && (
            <Badge variant="accent" size="sm">{offerLabel}</Badge>
          )}
        </div>

        {/* Rating pill */}
        <div className="absolute bottom-3 right-3 card-glass px-2.5 py-1 flex items-center gap-1.5 rounded-full">
          <StarFilled />
          <span className="text-xs font-bold text-text tracking-tight">{rating.toFixed(1)}</span>
          <span className="text-[10px] text-text-3">({reviewCount})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-text text-sm leading-tight tracking-tight">{name}</h3>
          <PriceRange value={priceRange} />
        </div>

        <p className="text-xs text-text-3 font-medium">{cuisine}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-text-3 font-medium pt-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {distance}
          </div>
          <div className="pt-2">
            <Button size="sm" variant="accent" onClick={(e) => { e.stopPropagation(); onReserve?.(id); }}>
              Réserver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
