import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { QRCodeSVG } from "qrcode.react";
import { useMyTables, useCreateTable, useDeleteTable } from "@/hooks/useTables";

export function TablesTab({ subscription, restaurantId }: { subscription: string; restaurantId: string }) {
  const { data: tables, isLoading } = useMyTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const [number, setNumber] = useState("");
  const [label,  setLabel]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formErr, setFormErr]  = useState("");

  const isCroissance = ["CROISSANCE", "DOMINATION"].includes(subscription);

  if (!isCroissance) {
    return (
      <div className="card text-center py-16 max-w-md">
        <p className="text-4xl mb-3">🪑</p>
        <p className="font-black text-text text-base">Tables QR</p>
        <p className="text-sm text-text-3 mt-2 max-w-xs mx-auto">Générez un QR code par table — les clients scannent et commandent directement.</p>
        <p className="mt-6 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold inline-block">Disponible dès le pack Croissance</p>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr("");
    const num = parseInt(number);
    if (!num || num < 1) { setFormErr("Numéro invalide"); return; }
    try {
      await createTable.mutateAsync({ number: num, label: label.trim() || undefined });
      setNumber(""); setLabel(""); setShowForm(false);
    } catch (e: any) { setFormErr(e.message ?? "Erreur"); }
  }

  function downloadQR(tableId: string, tableNum: number) {
    const svg = document.querySelector(`#qr-table-${tableId} svg`);
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `qr-table-${tableNum}.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={80} />)}</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-text">{tables?.length ?? 0} table{(tables?.length ?? 1) !== 1 ? "s" : ""}</p>
          <p className="text-xs text-text-3 mt-0.5">Chaque table a son propre QR de commande</p>
        </div>
        <Button size="sm" variant="accent" onClick={() => setShowForm(v => !v)}>
          {showForm ? "✕ Annuler" : "+ Ajouter une table"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-4 space-y-3">
          <p className="text-sm font-bold text-text">Nouvelle table</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-text-3 block mb-1">N° de table *</label>
              <input type="number" min="1" max="999" value={number} onChange={e => setNumber(e.target.value)} required
                placeholder="1"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-text-3 block mb-1">Étiquette (opt)</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Terrasse, VIP…"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
            </div>
          </div>
          {formErr && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{formErr}</p>}
          <Button type="submit" size="sm" variant="accent" loading={createTable.isPending} fullWidth>Créer la table</Button>
        </form>
      )}

      {!tables?.length && !showForm && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-semibold text-text">Aucune table</p>
          <p className="text-sm text-text-3 mt-1">Ajoutez vos tables pour générer des QR codes de commande.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {tables?.map(t => {
          const url = `${window.location.origin}/table/${t.id}`;
          return (
            <div key={t.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-text text-sm">Table {t.label ?? `N°${t.number}`}</p>
                  {t.label && <p className="text-[11px] text-text-3">N°{t.number}</p>}
                </div>
                <button onClick={() => deleteTable.mutate(t.id)}
                  className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">🗑️</button>
              </div>

              {/* QR Code */}
              <div id={`qr-table-${t.id}`} className="flex justify-center">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <QRCodeSVG value={url} size={120} level="M" includeMargin={false} />
                </div>
              </div>

              <button type="button" onClick={() => downloadQR(t.id, t.number)}
                className="w-full py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors">
                ⬇ Télécharger QR
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
