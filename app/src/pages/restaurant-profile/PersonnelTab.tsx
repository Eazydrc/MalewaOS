import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useMyStaff, useCreateStaff, useUpdateStaff, useDeleteStaff,
  useCreateStaffLogin, useDeleteStaffLogin,
  STAFF_ROLES, STAFF_ROLE_LABEL, StaffMember,
} from "@/hooks/useStaff";

function StaffLoginManager({ member, isDomination }: { member: StaffMember; isDomination: boolean }) {
  const createLogin = useCreateStaffLogin();
  const deleteLogin = useDeleteStaffLogin();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");

  if (!isDomination) return null;

  const hasLogin = !!member.userId;

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr("");
    if (!email.trim() || password.length < 8) { setErr("Email + mot de passe 8 car. min"); return; }
    try {
      await createLogin.mutateAsync({ id: member.id, email: email.trim(), password });
      setEmail(""); setPassword(""); setShowForm(false);
    } catch (e: any) { setErr(e.message ?? "Erreur"); }
  }

  if (hasLogin) return (
    <div className="mt-2 flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
      <span className="text-[11px] text-green-700 dark:text-green-400 font-semibold">🔑 Accès app actif</span>
      <button onClick={() => deleteLogin.mutate(member.id)}
        disabled={deleteLogin.isPending}
        className="text-[11px] text-red-500 hover:underline font-semibold disabled:opacity-50">
        {deleteLogin.isPending ? "…" : "Révoquer"}
      </button>
    </div>
  );

  return (
    <div className="mt-2">
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-semibold">
          + Créer accès app
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2 p-3 bg-surface-2 rounded-xl">
          <p className="text-[11px] font-bold text-text">Accès app pour {member.firstName}</p>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email de connexion"
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-accent/60" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe (8 car. min)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-accent/60" />
          {err && <p className="text-[11px] text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="accent" loading={createLogin.isPending}>Créer</Button>
            <button type="button" onClick={() => { setShowForm(false); setErr(""); }}
              className="text-xs text-text-3 hover:text-text">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function PersonnelTab({ subscription }: { subscription: string }) {
  const { data: staff, isLoading } = useMyStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const isCroissance = ["CROISSANCE", "DOMINATION"].includes(subscription);
  const isDomination = subscription === "DOMINATION";

  const [showForm,   setShowForm]   = useState(false);
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [role,       setRole]       = useState("SERVEUR");
  const [phone,      setPhone]      = useState("");
  const [formErr,    setFormErr]    = useState("");

  if (!isCroissance) return (
    <div className="card text-center py-16 max-w-md">
      <p className="text-4xl mb-3">👥</p>
      <p className="font-black text-text text-base">Gestion du personnel</p>
      <p className="text-sm text-text-3 mt-2 max-w-xs mx-auto">Ajoutez vos serveurs, cuisiniers et managers. Activez ou désactivez en un tap.</p>
      <p className="mt-6 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold inline-block">Disponible dès le pack Croissance</p>
    </div>
  );

  async function submit(e: FormEvent) {
    e.preventDefault(); setFormErr("");
    if (!firstName.trim() || !lastName.trim()) { setFormErr("Prénom et nom obligatoires"); return; }
    try {
      await createStaff.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), role, phone: phone.trim() || undefined });
      setFirstName(""); setLastName(""); setRole("SERVEUR"); setPhone(""); setShowForm(false);
    } catch (e: any) { setFormErr(e.message ?? "Erreur"); }
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={70} />)}</div>;

  const active   = staff?.filter(s => s.isActive)   ?? [];
  const inactive = staff?.filter(s => !s.isActive)  ?? [];

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text">{staff?.length ?? 0} membre{(staff?.length ?? 1) !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="accent" onClick={() => setShowForm(v => !v)}>
          {showForm ? "✕ Annuler" : "+ Ajouter"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-4 space-y-3">
          <p className="text-sm font-bold text-text">Nouveau membre</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom *" required
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom *" required
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={role} onChange={e => setRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60">
              {STAFF_ROLES.map(r => <option key={r} value={r}>{STAFF_ROLE_LABEL[r]}</option>)}
            </select>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone (opt)"
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text outline-none focus:border-accent/60" />
          </div>
          {formErr && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{formErr}</p>}
          <Button type="submit" size="sm" variant="accent" loading={createStaff.isPending} fullWidth>Ajouter le membre</Button>
        </form>
      )}

      {!staff?.length && !showForm && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-text">Aucun membre</p>
          <p className="text-sm text-text-3 mt-1">Ajoutez votre équipe pour mieux l'organiser.</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-2">
          <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">✅ Actifs ({active.length})</p>
          {active.map(m => (
            <div key={m.id} className="card p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-sm font-black text-accent shrink-0">
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">{m.firstName} {m.lastName}</p>
                  <p className="text-[11px] text-text-3">{STAFF_ROLE_LABEL[m.role] ?? m.role}{m.phone ? ` · ${m.phone}` : ""}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => updateStaff.mutate({ id: m.id, isActive: false })}
                    className="p-1.5 rounded-lg text-text-3 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Désactiver">⏸️</button>
                  <button onClick={() => deleteStaff.mutate(m.id)}
                    className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️</button>
                </div>
              </div>
              <StaffLoginManager member={m} isDomination={isDomination} />
            </div>
          ))}
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-2">
          <p className="text-[11px] font-bold text-text-3 uppercase tracking-wide">⏸️ Inactifs ({inactive.length})</p>
          {inactive.map(m => (
            <div key={m.id} className="card p-3 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-sm font-bold text-text-3 shrink-0">
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-2">{m.firstName} {m.lastName}</p>
                  <p className="text-[11px] text-text-3">{STAFF_ROLE_LABEL[m.role] ?? m.role}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => updateStaff.mutate({ id: m.id, isActive: true })}
                    className="p-1.5 rounded-lg text-text-3 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Réactiver">▶️</button>
                  <button onClick={() => deleteStaff.mutate(m.id)}
                    className="p-1.5 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {!isDomination && (
        <div className="card p-4 flex items-center gap-3 border border-dashed border-orange-300 dark:border-orange-700">
          <span className="text-2xl">👑</span>
          <div>
            <p className="text-xs font-black text-text">Comptes app staff — Pack Domination</p>
            <p className="text-[11px] text-text-3 mt-0.5">Donnez un accès app à chaque membre pour gérer les commandes et réservations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
