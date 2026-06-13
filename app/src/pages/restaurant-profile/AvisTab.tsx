import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyReviews, useReplyReview } from "@/hooks/useReviews";
import { ESSENTIEL_TIERS } from "./shared";

export function AvisTab({ subscription }: { subscription: string }) {
  const { data: reviews, isLoading } = useMyReviews();
  const replyMutation = useReplyReview();
  const [replyId,   setReplyId]   = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const isEssentiel = ESSENTIEL_TIERS.includes(subscription);

  async function sendReply(id: string) {
    if (!replyText.trim()) return;
    await replyMutation.mutateAsync({ id, reply: replyText.trim() });
    setReplyId(null); setReplyText("");
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={100} />)}</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text">{reviews?.length ?? 0} avis client{(reviews?.length ?? 0) !== 1 ? "s" : ""}</p>
        {!isEssentiel && (
          <span className="text-[11px] px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-bold">
            Répondre aux avis → pack Essentiel
          </span>
        )}
      </div>

      {!reviews?.length && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-text">Aucun avis</p>
          <p className="text-sm text-text-3 mt-1">Les avis de vos clients apparaîtront ici.</p>
        </div>
      )}

      {reviews?.map(rv => (
        <div key={rv.id} className="card p-4 space-y-3">
          {/* Header client */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-black text-accent shrink-0">
              {rv.user.avatarUrl
                ? <img src={rv.user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                : `${rv.user.firstName[0]}${rv.user.lastName[0]}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text">{rv.user.firstName} {rv.user.lastName}</p>
              <p className="text-[11px] text-text-3">{new Date(rv.createdAt).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}</p>
            </div>
            {/* Étoiles */}
            <div className="flex gap-0.5 shrink-0">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-sm ${s <= rv.rating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}>★</span>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          {rv.comment && <p className="text-sm text-text-2 pl-12">{rv.comment}</p>}

          {/* Réponse existante */}
          {rv.ownerReply && (
            <div className="ml-12 pl-3 border-l-2 border-accent/30 space-y-0.5">
              <p className="text-[11px] font-bold text-accent">Votre réponse</p>
              <p className="text-xs text-text-2">{rv.ownerReply}</p>
              {rv.repliedAt && <p className="text-[10px] text-text-3">{new Date(rv.repliedAt).toLocaleDateString("fr-FR")}</p>}
            </div>
          )}

          {/* Bouton/formulaire de réponse */}
          {isEssentiel && !rv.ownerReply && (
            replyId === rv.id ? (
              <div className="ml-12 space-y-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                  placeholder="Votre réponse au client..." autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60 resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" variant="accent" loading={replyMutation.isPending} onClick={() => sendReply(rv.id)}>Envoyer</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyId(null); setReplyText(""); }}>Annuler</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setReplyId(rv.id); setReplyText(""); }}
                className="ml-12 text-xs font-semibold text-accent hover:underline">
                💬 Répondre
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}
