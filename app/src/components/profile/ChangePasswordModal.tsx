import { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (open) { setCurrent(""); setNext(""); setConfirm(""); setError(""); setSuccess(false); }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (next.length < 8)  { setError("Minimum 8 caractères"); return; }
    setLoading(true);
    setError("");
    try {
      await api.patch("/auth/change-password", { currentPassword: current, newPassword: next });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message ?? "Mot de passe actuel incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg border border-border rounded-2xl p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tighter text-text">Changer le mot de passe</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-2xl bg-success-soft flex items-center justify-center text-3xl">🔒</div>
            <p className="font-bold text-text">Mot de passe modifié !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Mot de passe actuel" type="password" value={current}
              onChange={e => setCurrent(e.target.value)} required />
            <Input label="Nouveau mot de passe" type="password" value={next}
              onChange={e => setNext(e.target.value)} required placeholder="Minimum 8 caractères" />
            <Input label="Confirmer le nouveau" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required />
            {error && <p className="text-xs text-danger font-medium bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>Annuler</Button>
              <Button type="submit" variant="accent" fullWidth loading={loading}>Modifier</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
