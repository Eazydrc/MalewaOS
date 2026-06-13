import { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EditProfileModal({ open, onClose }: Props) {
  const { user, fetchMe } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName,  setLastName]  = useState(user?.lastName  ?? "");
  const [phone,     setPhone]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  // Reset quand on ouvre
  useEffect(() => {
    if (open && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setError("");
      setSuccess(false);
    }
  }, [open, user]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.patch("/auth/me", { firstName, lastName, phone: phone || undefined });
      await fetchMe();
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg border border-border rounded-2xl p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tighter text-text">Modifier le profil</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-2xl bg-success-soft flex items-center justify-center text-3xl">✅</div>
            <p className="font-bold text-text">Profil mis à jour !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+243 8XX XXX XXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              helper="Laisser vide pour ne pas modifier"
            />

            {error && (
              <p className="text-xs text-danger font-medium bg-danger-soft rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>Annuler</Button>
              <Button type="submit" variant="accent" fullWidth loading={loading}>Enregistrer</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
