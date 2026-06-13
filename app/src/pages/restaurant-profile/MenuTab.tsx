import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  useMenu, useCreateSection, useUpdateSection, useDeleteSection,
  useCreateItem, useUpdateItem, useToggleItem, useDeleteItem,
  MenuSection, MenuItem,
} from "@/hooks/useMenu";
import { fc } from "./shared";

// ─── Badges plat ──────────────────────────────────────────────────────────────

function ItemBadges({ item }: { item: MenuItem }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {item.isHot       && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">🔥 Vente chaude</span>}
      {item.isLastUnits && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">⚡ Dernières unités</span>}
      {item.promoPrice  != null && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">🏷️ Promo</span>}
    </div>
  );
}

// ─── Vue affichage menu (lecture) ─────────────────────────────────────────────

function MenuDisplay({
  menu, onEdit, toggleItem,
}: {
  menu: any;
  onEdit: () => void;
  toggleItem: any;
}) {
  const totalItems = menu?.sections?.reduce((s: number, sec: MenuSection) => s + (sec.items?.length ?? 0), 0) ?? 0;
  const available  = menu?.sections?.reduce((s: number, sec: MenuSection) =>
    s + (sec.items?.filter((i: MenuItem) => i.isAvailable).length ?? 0), 0) ?? 0;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Barre d'actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-text">{totalItems} plats · <span className="text-green-600">{available} disponibles</span></p>
          <p className="text-xs text-text-3 mt-0.5">Touchez un plat pour le désactiver</p>
        </div>
        <Button size="sm" variant="accent" onClick={onEdit}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier le menu
        </Button>
      </div>

      {!menu?.sections?.length && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-black text-text">Menu vide</p>
          <p className="text-sm text-text-3 mt-1 mb-5">Cliquez sur "Modifier le menu" pour commencer</p>
        </div>
      )}

      {menu?.sections?.map((section: MenuSection) => (
        <div key={section.id} className="space-y-2">
          <h3 className="text-xs font-black text-text-3 uppercase tracking-widest px-1">{section.title}</h3>
          <div className="card p-0 overflow-hidden divide-y divide-border/50">
            {section.items?.length === 0 && (
              <p className="px-4 py-4 text-xs text-text-3 italic">Aucun plat dans cette section</p>
            )}
            {section.items?.map((item: MenuItem) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${!item.isAvailable ? "bg-surface-2 opacity-60" : "bg-surface"}`}>
                {/* Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 shrink-0 flex items-center justify-center text-2xl">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : "🍽️"
                  }
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${item.isAvailable ? "text-text" : "text-text-3 line-through"}`}>
                    {item.name}
                  </p>
                  {item.description && <p className="text-xs text-text-3 mt-0.5 line-clamp-1">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.promoPrice != null ? (
                      <>
                        <p className="text-sm font-black text-accent">{fc(item.promoPrice)}</p>
                        <p className="text-xs text-text-3 line-through">{fc(item.priceUsdCents)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-black text-accent">{fc(item.priceUsdCents)}</p>
                    )}
                  </div>
                  <ItemBadges item={item} />
                </div>

                {/* Toggle disponibilité */}
                <button
                  onClick={() => toggleItem.mutate(item.id)}
                  className={`shrink-0 relative w-11 h-6 rounded-full transition-colors ${item.isAvailable ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.isAvailable ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Formulaire plat (mode édition) ──────────────────────────────────────────

function ItemForm({ initial, onSave, onCancel, loading }: {
  initial?: MenuItem;
  onSave: (d: {
    name: string; description: string; priceUsdCents: number;
    promoPrice: number | null; imageUrl: string;
    isHot: boolean; isLastUnits: boolean;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name,       setName]      = useState(initial?.name ?? "");
  const [desc,       setDesc]      = useState(initial?.description ?? "");
  const [img,        setImg]       = useState(initial?.imageUrl ?? "");
  const [priceIn,    setPrice]     = useState(initial ? String(initial.priceUsdCents / 100) : "");
  const [promoIn,    setPromo]     = useState(initial?.promoPrice != null ? String(initial.promoPrice / 100) : "");
  const [isHot,      setHot]       = useState(initial?.isHot ?? false);
  const [isLast,     setLast]      = useState(initial?.isLastUnits ?? false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(priceIn.replace(",", ".")) * 100);
    const promo = promoIn.trim() ? Math.round(parseFloat(promoIn.replace(",", ".")) * 100) : null;
    if (!name || isNaN(cents) || cents < 0) return;
    onSave({ name, description: desc, priceUsdCents: cents, promoPrice: promo, imageUrl: img, isHot, isLastUnits: isLast });
  }

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) => (
    <button type="button" onClick={onChange}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${value ? "bg-accent text-white border-accent" : "border-border text-text-3 hover:border-accent/40"}`}>
      {label}
    </button>
  );

  return (
    <form onSubmit={submit} className="space-y-3 p-4 bg-accent/5 border border-accent/20 rounded-2xl">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du plat *" required
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (facultatif)"
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <input type="number" min="0" step="1" value={priceIn} onChange={e => setPrice(e.target.value)}
            placeholder="Prix FC *" required
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          <span className="text-xs font-bold text-text-3">FC</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min="0" step="1" value={promoIn} onChange={e => setPromo(e.target.value)}
            placeholder="Prix promo (opt)"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          <span className="text-xs font-bold text-text-3">FC</span>
        </div>
      </div>

      <ImageUpload
        value={img}
        onChange={setImg}
        shape="wide"
        size="md"
        placeholder="Photo du plat (optionnel)"
      />

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Toggle label="🔥 Vente chaude"    value={isHot}  onChange={() => setHot(v => !v)} />
        <Toggle label="⚡ Dernières unités" value={isLast} onChange={() => setLast(v => !v)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" variant="accent" loading={loading}>{initial ? "Enregistrer" : "Ajouter"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}

// ─── Mode édition menu ────────────────────────────────────────────────────────

function MenuEdit({ onClose }: { onClose: () => void }) {
  const { data: menu, isLoading } = useMenu();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const createItem    = useCreateItem();
  const updateItem    = useUpdateItem();
  const toggleItem    = useToggleItem();
  const deleteItem    = useDeleteItem();

  const [newTitle,   setNewTitle]   = useState("");
  const [addSec,     setAddSec]     = useState(false);
  const [editSecId,  setEditSecId]  = useState<string | null>(null);
  const [editSecTtl, setEditSecTtl] = useState("");
  const [addItemTo,  setAddItemTo]  = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} height={90} />)}</div>;

  async function createSec(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createSection.mutateAsync({ title: newTitle.trim() });
    setNewTitle(""); setAddSec(false);
  }

  async function saveSec(id: string) {
    if (!editSecTtl.trim()) return;
    await updateSection.mutateAsync({ id, title: editSecTtl.trim() });
    setEditSecId(null);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text">Mode édition</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAddSec(true)}>+ Section</Button>
          <Button size="sm" variant="accent" onClick={onClose}>✓ Terminer</Button>
        </div>
      </div>

      {addSec && (
        <form onSubmit={createSec} className="flex gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Nom de la section" autoFocus
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          <Button type="submit" size="sm" variant="accent" loading={createSection.isPending}>Créer</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAddSec(false)}>✕</Button>
        </form>
      )}

      {!menu?.sections?.length && !addSec && (
        <div className="card text-center py-12">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="font-semibold text-text-2">Aucune section</p>
          <Button size="sm" variant="accent" className="mt-4" onClick={() => setAddSec(true)}>+ Créer une section</Button>
        </div>
      )}

      {menu?.sections?.map((section: MenuSection) => (
        <div key={section.id} className="card p-0 overflow-hidden">
          {/* Header section */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-2 border-b border-border/60">
            {editSecId === section.id ? (
              <div className="flex gap-2 flex-1">
                <input value={editSecTtl} onChange={e => setEditSecTtl(e.target.value)} autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent/60" />
                <button onClick={() => saveSec(section.id)} className="text-xs font-black text-green-600 px-2">✓</button>
                <button onClick={() => setEditSecId(null)} className="text-xs font-black text-text-3 px-2">✕</button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold text-text">
                  {section.title} <span className="font-normal text-text-3 text-xs">({section.items?.length ?? 0})</span>
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditSecId(section.id); setEditSecTtl(section.title); }}
                    className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-surface transition-colors">✏️</button>
                  <button onClick={() => deleteSection.mutate(section.id)}
                    className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️</button>
                </div>
              </>
            )}
          </div>

          {/* Items */}
          <div className="divide-y divide-border/50">
            {section.items?.map((item: MenuItem) => (
              <div key={item.id}>
                {editItemId === item.id ? (
                  <div className="p-4">
                    <ItemForm initial={item} loading={updateItem.isPending}
                      onCancel={() => setEditItemId(null)}
                      onSave={async (d) => {
                        await updateItem.mutateAsync({
                          id: item.id,
                          name: d.name, description: d.description,
                          priceUsdCents: d.priceUsdCents,
                          promoPrice: d.promoPrice ?? undefined,
                          imageUrl: d.imageUrl,
                          isHot: d.isHot, isLastUnits: d.isLastUnits,
                        });
                        setEditItemId(null);
                      }} />
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 px-4 py-3 ${!item.isAvailable ? "opacity-50" : ""}`}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2 shrink-0 flex items-center justify-center text-xl">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : "🍽️"
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-accent">{fc(item.priceUsdCents)}</p>
                        {item.promoPrice != null && <p className="text-xs text-green-600 font-bold">→ {fc(item.promoPrice)}</p>}
                        {item.isHot && <span className="text-[10px]">🔥</span>}
                        {item.isLastUnits && <span className="text-[10px]">⚡</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleItem.mutate(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${item.isAvailable ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-text-3 hover:bg-surface-2"}`}>
                        {item.isAvailable ? "✅" : "⬜"}
                      </button>
                      <button onClick={() => setEditItemId(item.id)}
                        className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-surface-2 transition-colors">✏️</button>
                      <button onClick={() => deleteItem.mutate(item.id)}
                        className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addItemTo === section.id ? (
              <div className="p-4">
                <ItemForm loading={createItem.isPending}
                  onCancel={() => setAddItemTo(null)}
                  onSave={async (d) => {
                    await createItem.mutateAsync({
                      sectionId: section.id,
                      name: d.name, description: d.description,
                      priceUsdCents: d.priceUsdCents,
                      promoPrice: d.promoPrice ?? undefined,
                      imageUrl: d.imageUrl,
                      isHot: d.isHot, isLastUnits: d.isLastUnits,
                    });
                    setAddItemTo(null);
                  }} />
              </div>
            ) : (
              <button onClick={() => setAddItemTo(section.id)}
                className="w-full py-3 text-xs font-semibold text-accent hover:bg-accent/5 transition-colors">
                + Ajouter un plat
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Onglet Menu (conteneur) ──────────────────────────────────────────────────

export function MenuTab() {
  const { data: menu, isLoading } = useMenu();
  const toggleItem = useToggleItem();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={90} />)}</div>;

  if (editing) return <MenuEdit onClose={() => setEditing(false)} />;

  return (
    <MenuDisplay
      menu={menu}
      onEdit={() => setEditing(true)}
      toggleItem={toggleItem}
    />
  );
}
