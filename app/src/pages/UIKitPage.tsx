import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, RestaurantCardSkeleton } from "@/components/ui/Skeleton";
import { RestaurantCard } from "@/components/ui/RestaurantCard";
import { OfferCard } from "@/components/ui/OfferCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-text-3 uppercase tracking-widest border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

const MOCK_RESTAURANTS = [
  {
    id: "1",
    name: "Le Kimpese",
    cuisine: "Congolaise · Grillades",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=160&fit=crop",
    rating: 4.7,
    reviewCount: 142,
    distance: "1.2 km",
    priceRange: 2 as const,
    tags: ["Grillades", "Poisson"],
    isOpen: true,
    hasOffer: true,
    offerLabel: "-15%",
  },
  {
    id: "2",
    name: "Chez Mama Afrika",
    cuisine: "Africaine · Traditionnel",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=160&fit=crop",
    rating: 4.4,
    reviewCount: 89,
    distance: "2.8 km",
    priceRange: 1 as const,
    tags: ["Traditionnel", "Végétarien"],
    isOpen: false,
  },
];

const MOCK_OFFERS = [
  {
    id: "o1",
    title: "Menu découverte pour 2",
    description: "Entrée + Plat + Dessert pour deux personnes",
    restaurant: "Le Kimpese",
    discount: "-20%",
    expiresIn: "dans 2 jours",
    type: "promo" as const,
  },
  {
    id: "o2",
    title: "Repas gratuit",
    description: "Échangez vos points contre un repas complet",
    restaurant: "Chez Mama Afrika",
    discount: "Gratuit",
    expiresIn: "dans 30 jours",
    pointsCost: 200,
    type: "points" as const,
  },
  {
    id: "o3",
    title: "Déjeuner express",
    description: "Offre valable aujourd'hui uniquement de 12h à 14h",
    restaurant: "Le Kimpese",
    discount: "-30%",
    expiresIn: "ce soir",
    type: "flash" as const,
  },
];

export default function UIKitPage() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  function simulateLoad() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-10">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-text">Elen<span className="text-gradient-accent">gi</span> — UI Kit</h1>
            <p className="text-text-3 text-sm mt-0.5 font-medium">Design System · Mode clair &amp; sombre</p>
          </div>
          <ThemeToggle />
        </div>

        {/* BUTTONS */}
        <Section title="Buttons — Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="accent">Accent</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button loading onClick={simulateLoad}>Chargement</Button>
            <Button disabled>Désactivé</Button>
            <Button variant="accent" loading={loading} onClick={simulateLoad}>
              {loading ? "Envoi..." : "Tester loading"}
            </Button>
          </div>
          <Button fullWidth>Pleine largeur</Button>
        </Section>

        {/* BADGES */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Confirmé</Badge>
            <Badge variant="danger">Annulé</Badge>
            <Badge variant="warning">En attente</Badge>
            <Badge variant="accent">Nouveau</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>Ouvert</Badge>
            <Badge variant="danger" dot>Fermé</Badge>
            <Badge variant="warning" dot>Bientôt</Badge>
            <Badge variant="accent" size="sm">Petit</Badge>
          </div>
        </Section>

        {/* INPUTS */}
        <Section title="Inputs">
          <Input label="Email" type="email" placeholder="jean@example.cd" />
          <Input label="Téléphone" type="tel" placeholder="+243 8XX XXX XXX"
            prefix={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.56 2.81.69a2 2 0 0 1 1.77 2.01Z"/></svg>}
            helper="Orange Money · Airtel Money" />
          <Input label="Mot de passe" type="password" placeholder="Minimum 8 caractères"
            value={inputValue} onChange={e => setInputValue(e.target.value)} />
          <Input label="Champ erreur" placeholder="Texte invalide" defaultValue="erreur@" error="Format d'email invalide" />
        </Section>

        {/* CARDS */}
        <Section title="Cards">
          <Card>
            <p className="text-sm text-text font-medium">Card standard</p>
            <p className="text-xs text-text-3 mt-1">Contenu quelconque dans une card par défaut.</p>
          </Card>
          <Card hover>
            <p className="text-sm text-text font-medium">Card avec hover</p>
            <p className="text-xs text-text-3 mt-1">Passez la souris pour voir l'effet de survol.</p>
          </Card>
        </Section>

        {/* SKELETON */}
        <Section title="Skeletons — Loading states">
          <div className="space-y-2">
            <Skeleton height={20} width={200} />
            <Skeleton height={14} width={140} />
            <Skeleton height={14} width={160} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <RestaurantCardSkeleton />
            <RestaurantCardSkeleton />
          </div>
        </Section>

        {/* RESTAURANT CARDS */}
        <Section title="Restaurant Cards">
          <div className="grid grid-cols-1 gap-4">
            {MOCK_RESTAURANTS.map((r) => (
              <RestaurantCard key={r.id} {...r} onReserve={(id) => alert(`Réserver: ${id}`)} />
            ))}
          </div>
        </Section>

        {/* OFFER CARDS */}
        <Section title="Offer Cards">
          <div className="grid grid-cols-1 gap-4">
            {MOCK_OFFERS.map((o) => (
              <OfferCard key={o.id} {...o} onClaim={(id) => alert(`Offre utilisée: ${id}`)} />
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
