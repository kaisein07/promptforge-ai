import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useGetAdminConfig, useCreatePayment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Zap, Loader2, CreditCard, User as UserIcon, Mail, Phone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money" },
  { id: "mtn_momo", label: "MTN Mobile Money" },
  { id: "wave", label: "Wave" },
  { id: "moov_money", label: "Moov Money" },
  { id: "autre", label: "Autre" },
];

export default function Profile() {
  const { user } = useAuth();
  const { data: config } = useGetAdminConfig();
  const createPaymentMutation = useCreatePayment();

  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const premiumPrice = config?.find(c => c.key === "premium_price")?.value || "10000 FCFA";
  const freeLimit = parseInt(config?.find(c => c.key === "free_limit")?.value || "5", 10);
  const amountNum = parseInt(premiumPrice.replace(/\D/g, ""), 10) || 10000;

  const handleSubmit = () => {
    if (!phone.trim()) { toast.error("Veuillez saisir votre numéro de téléphone."); return; }
    if (!method) { toast.error("Veuillez choisir votre opérateur."); return; }
    if (!ref.trim()) { toast.error("Veuillez saisir la référence de transaction."); return; }

    createPaymentMutation.mutate({
      data: {
        amount: amountNum,
        currency: "FCFA",
        transactionRef: ref.trim(),
        phoneNumber: phone.trim(),
        paymentMethod: method,
        notes: notes.trim(),
      }
    }, {
      onSuccess: () => {
        setSubmitted(true);
      },
      onError: () => {
        toast.error("Erreur lors de l'envoi. Réessayez.");
      }
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Mon Profil</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Infos User */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center mb-4 relative">
              <span className="text-3xl font-bold text-primary">{user.name.substring(0, 2).toUpperCase()}</span>
              {user.isPremium && (
                <div className="absolute -bottom-2 bg-black rounded-full p-1 border border-yellow-500/50">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm">
              <Mail className="w-4 h-4" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
              <UserIcon className="w-4 h-4" /> Membre depuis {format(new Date(user.createdAt), "MMM yyyy", { locale: fr })}
            </div>

            <div className="mt-6 w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
              <p className="text-sm text-muted-foreground mb-1">Prompts générés</p>
              <p className="text-2xl font-bold text-white">{user.promptsUsed}</p>
            </div>
          </div>
        </div>

        {/* Plan / Subscription */}
        <div className="md:col-span-2">
          {!user.isPremium ? (
            <div className="glass-panel p-1 rounded-3xl border border-primary/30 electric-glow relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-bl-full blur-3xl -z-10" />
              <div className="bg-[#0f0f13]/90 rounded-[22px] p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-white">Passez au niveau supérieur</h2>
                </div>
                <p className="text-muted-foreground mb-8">
                  Débloquez le plein potentiel de PromptForge AI. Limite actuelle : {user.promptsUsed} / {freeLimit} prompts gratuits.
                </p>

                <ul className="space-y-4 mb-auto">
                  {[
                    "Génération de prompts illimitée",
                    "Accès à tous les modèles IA (Midjourney v6, DALL-E 3)",
                    "Historique complet et favoris illimités",
                    "Assistance prioritaire"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paiement unique / à vie</p>
                    <p className="text-3xl font-bold text-white">{premiumPrice}</p>
                  </div>
                  <Button
                    onClick={() => { setShowModal(true); setSubmitted(false); }}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white electric-glow rounded-xl"
                  >
                    <CreditCard className="w-4 h-4 mr-2" /> Devenir Premium
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-yellow-500/30 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)] h-full flex flex-col justify-center">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-6">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Abonnement Premium Actif</h2>
              <p className="text-muted-foreground mb-8">
                Merci de faire partie de nos membres privilégiés. Vous avez accès à toutes les fonctionnalités en illimité.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="border-white/10 text-white pointer-events-none">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" /> Statut Actif
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0f0f13] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-yellow-500" /> Passer en Premium
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Effectuez un virement de <span className="text-white font-bold">{premiumPrice}</span> puis remplissez ce formulaire. Votre compte sera activé après validation par notre équipe.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-semibold text-lg">Demande envoyée !</p>
              <p className="text-muted-foreground text-sm">
                Votre demande de passage en Premium est en cours d'examen. Vous recevrez une confirmation sous 24h.
              </p>
              <Button onClick={() => setShowModal(false)} className="bg-primary text-white mt-2">Fermer</Button>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm space-y-1">
                <p className="font-medium text-white mb-2">📱 Instructions de paiement</p>
                <p className="text-muted-foreground">Envoyez <span className="text-white font-bold">{premiumPrice}</span> au numéro de l'administrateur via votre opérateur mobile, puis renseignez votre numéro et la référence de transaction ci-dessous.</p>
              </div>

              <div className="space-y-4">
                {/* Opérateur */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Opérateur utilisé *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                          method === m.id
                            ? "border-primary bg-primary/20 text-white"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"
                        }`}
                      >
                        <Wallet className="w-4 h-4 shrink-0" /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Votre numéro de téléphone *
                  </label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex: 07 XX XX XX XX"
                    className="bg-black/30 border-white/10 text-white focus-visible:ring-primary"
                  />
                </div>

                {/* Référence transaction */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Référence de transaction *</label>
                  <Input
                    value={ref}
                    onChange={e => setRef(e.target.value)}
                    placeholder="Ex: MP231015.1234.AB1234"
                    className="bg-black/30 border-white/10 text-white focus-visible:ring-primary"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Notes (optionnel)</label>
                  <Input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Informations supplémentaires..."
                    className="bg-black/30 border-white/10 text-white focus-visible:ring-primary"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)} className="border-white/10 text-white">
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createPaymentMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Soumettre ma demande
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
