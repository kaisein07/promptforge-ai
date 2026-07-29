import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useGeneratePrompt, useCreatePayment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Sparkles, ImageIcon, ShoppingBag, Megaphone, Paintbrush, Camera, BookOpen, Layout, Shapes, Palette,
  Briefcase, Utensils, Home, Shirt, Droplets, Monitor, GraduationCap, HeartPulse, MoreHorizontal,
  Facebook, Instagram, MonitorPlay, ShoppingCart, Package, FileText, Globe, 
  Wand2, Gem, Film, CircleDot, Smile, Zap, Box,
  Cpu, Bot,
  ArrowRight, ArrowLeft, Check, Loader2, Crown, Phone, Wallet
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money" },
  { id: "mtn_momo", label: "MTN MoMo" },
  { id: "wave", label: "Wave" },
  { id: "moov_money", label: "Moov Money" },
  { id: "autre", label: "Autre" },
];

// Icons and choices mapping
const projectTypes = [
  { id: "Générer une image", icon: ImageIcon },
  { id: "Modifier une image", icon: Paintbrush },
  { id: "Photo produit", icon: ShoppingBag },
  { id: "Publicité", icon: Megaphone },
  { id: "Logo", icon: Shapes },
  { id: "Portrait réaliste", icon: Camera },
  { id: "Personnage manga", icon: Palette },
  { id: "Miniature YouTube", icon: Layout },
  { id: "Publication Instagram", icon: BookOpen },
  { id: "Autre", icon: MoreHorizontal },
];

const niches = [
  { id: "Entreprise", icon: Briefcase },
  { id: "Restaurant", icon: Utensils },
  { id: "Immobilier", icon: Home },
  { id: "Mode", icon: Shirt },
  { id: "Cosmétique", icon: Droplets },
  { id: "Technologie", icon: Monitor },
  { id: "Éducation", icon: GraduationCap },
  { id: "Santé", icon: HeartPulse },
  { id: "Autre", icon: MoreHorizontal },
];

const destinations = [
  { id: "Facebook", icon: Facebook },
  { id: "Instagram", icon: Instagram },
  { id: "TikTok", icon: MonitorPlay },
  { id: "Shopify", icon: ShoppingCart },
  { id: "Amazon", icon: Package },
  { id: "Flyer", icon: FileText },
  { id: "Catalogue", icon: BookOpen },
  { id: "Site Web", icon: Globe },
  { id: "Autre", icon: MoreHorizontal },
];

const styles = [
  { id: "Réaliste", icon: Camera },
  { id: "Luxe", icon: Gem },
  { id: "Cinématique", icon: Film },
  { id: "Minimaliste", icon: CircleDot },
  { id: "Cartoon", icon: Smile },
  { id: "Manga", icon: Palette },
  { id: "Pixar", icon: Wand2 },
  { id: "Studio Ghibli", icon: ImageIcon },
  { id: "Futuriste", icon: Zap },
  { id: "3D", icon: Box },
];

export default function Wizard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectType: "",
    niche: "",
    description: "",
    imageUrl: "",
    destination: "",
    style: "",
    aiPreference: "auto"
  });

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [paySubmitted, setPaySubmitted] = useState(false);
  const [payPhone, setPayPhone] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const generateMutation = useGeneratePrompt();
  const createPaymentMutation = useCreatePayment();

  const [premiumPrice, setPremiumPrice] = useState("10000 FCFA");
  const [freeLimit, setFreeLimit] = useState(5);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then((cfg: { premium_price?: string; free_limit?: string }) => {
        if (cfg.premium_price) setPremiumPrice(cfg.premium_price);
        if (cfg.free_limit) setFreeLimit(parseInt(cfg.free_limit, 10) || 5);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  // Parse initial query params (e.g. from dashboard quick start)
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const type = params.get("type");
    if (type) {
      setFormData(prev => ({ ...prev, projectType: type }));
      setStep(2); // Auto advance to step 2 if type is pre-selected
    }
  }, [searchString]);

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 8) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = () => {
    // Check limits
    if (!user?.isPremium && (user?.promptsUsed ?? 0) >= freeLimit) {
      setShowPremiumModal(true);
      return;
    }

    setStep(9); // Loading state
    
    generateMutation.mutate({
      data: {
        projectType: formData.projectType,
        niche: formData.niche,
        description: formData.description,
        imageUrl: formData.imageUrl || null,
        destination: formData.destination,
        style: formData.style,
        aiPreference: formData.aiPreference === "auto" ? null : formData.aiPreference
      }
    }, {
      onSuccess: (data) => {
        setLocation(`/resultat/${data.id}`);
      },
      onError: () => {
        toast.error("Erreur lors de la génération. Veuillez réessayer.");
        setStep(8); // Go back to summary
      }
    });
  };

  const handleUpgrade = () => {
    if (!payPhone.trim()) { toast.error("Veuillez saisir votre numéro de téléphone."); return; }
    if (!payMethod) { toast.error("Veuillez choisir votre opérateur."); return; }
    if (!payRef.trim()) { toast.error("Veuillez saisir la référence de transaction."); return; }

    createPaymentMutation.mutate({
      data: {
        amount: parseInt(premiumPrice.replace(/\D/g, ''), 10) || 10000,
        currency: "FCFA",
        transactionRef: payRef.trim(),
        phoneNumber: payPhone.trim(),
        paymentMethod: payMethod,
        notes: payNotes.trim(),
      }
    }, {
      onSuccess: () => {
        setPaySubmitted(true);
      },
      onError: () => {
        toast.error("Erreur lors de l'envoi. Réessayez.");
      }
    });
  };

  const renderGridChoices = (
    choices: {id: string, icon: React.ElementType}[], 
    field: keyof typeof formData
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
      {choices.map(choice => {
        const isSelected = formData[field] === choice.id;
        return (
          <button
            key={choice.id}
            onClick={() => {
              updateForm(field, choice.id);
              setTimeout(handleNext, 300); // Auto advance
            }}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 group
              ${isSelected 
                ? 'bg-primary/20 border-primary electric-glow text-white' 
                : 'glass-panel border-white/5 text-muted-foreground hover:bg-white/5 hover:border-white/20 hover:text-white'
              }`}
          >
            <choice.icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-primary' : 'group-hover:text-white'}`} />
            <span className="text-sm font-medium text-center">{choice.id}</span>
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Premium Modal */}
      <Dialog open={showPremiumModal} onOpenChange={(open) => { setShowPremiumModal(open); if (!open) setPaySubmitted(false); }}>
        <DialogContent className="bg-[#0f0f13] border border-white/10 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-yellow-500" /> Passer en Premium
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Vous avez atteint la limite de {freeLimit} prompts gratuits. Envoyez <span className="text-white font-bold">{premiumPrice}</span> puis remplissez ce formulaire — votre compte sera activé après validation.
            </DialogDescription>
          </DialogHeader>

          {paySubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-semibold text-lg">Demande envoyée !</p>
              <p className="text-muted-foreground text-sm">Votre demande est en cours d'examen. Vous recevrez une confirmation sous 24h.</p>
              <Button onClick={() => { setShowPremiumModal(false); setPaySubmitted(false); }} className="bg-primary text-white">Fermer</Button>
            </div>
          ) : (
            <>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-white mb-1">📱 Instructions</p>
                <p className="text-muted-foreground">Effectuez un paiement mobile de <span className="text-white font-bold">{premiumPrice}</span> à l'administrateur, puis renseignez les détails ci-dessous.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Opérateur utilisé *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.id} onClick={() => setPayMethod(m.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${payMethod === m.id ? "border-primary bg-primary/20 text-white" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"}`}>
                        <Wallet className="w-4 h-4 shrink-0" /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block flex items-center gap-1"><Phone className="w-3 h-3" /> Votre numéro *</label>
                  <Input value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="Ex: 07 XX XX XX XX" className="bg-black/30 border-white/10 text-white focus-visible:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Référence de transaction *</label>
                  <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ex: MP231015.1234.AB1234" className="bg-black/30 border-white/10 text-white focus-visible:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Notes (optionnel)</label>
                  <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Informations supplémentaires..." className="bg-black/30 border-white/10 text-white focus-visible:ring-primary" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPremiumModal(false)} className="border-white/10 text-white">Annuler</Button>
                <Button onClick={handleUpgrade} disabled={createPaymentMutation.isPending} className="bg-primary hover:bg-primary/90 text-white electric-glow gap-2">
                  {createPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Soumettre ma demande
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Bar */}
      {step < 9 && (
        <div className="mb-12">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-3">
            <span>Étape {step} sur 8</span>
            <span>{Math.round((step / 8) * 100)}% complété</span>
          </div>
          <Progress value={(step / 8) * 100} className="h-2 bg-white/5" indicatorClassName="bg-primary electric-glow" />
        </div>
      )}

      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Quel type d'image souhaitez-vous créer ?</h2>
              <p className="text-muted-foreground">Sélectionnez le format qui correspond le mieux à votre besoin.</p>
              {renderGridChoices(projectTypes, "projectType")}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Quel est le domaine de votre projet ?</h2>
              <p className="text-muted-foreground">Cela nous aide à adapter le vocabulaire et l'ambiance visuelle.</p>
              {renderGridChoices(niches, "niche")}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Décrivez précisément votre besoin</h2>
              <p className="text-muted-foreground mb-8">Soyez aussi descriptif que possible. Couleurs, ambiance, éléments clés...</p>
              
              <Textarea 
                placeholder="Ex: Un café confortable sous la pluie avec des néons bleus, style cyberpunk, un chat qui dort sur le comptoir..."
                className="min-h-[200px] text-lg bg-black/30 border-white/10 text-white rounded-2xl p-6 focus-visible:ring-primary"
                value={formData.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Avez-vous une image de référence ? (Optionnel)</h2>
              <p className="text-muted-foreground mb-8">Collez l'URL d'une image pour guider l'IA, ou passez cette étape.</p>
              
              <div className="glass-panel border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <Input 
                  placeholder="https://exemple.com/mon-image.jpg"
                  className="max-w-md bg-black/30 border-white/10 text-white h-12 rounded-xl text-center"
                  value={formData.imageUrl}
                  onChange={(e) => updateForm("imageUrl", e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Quelle est la destination de l'image ?</h2>
              <p className="text-muted-foreground">Nous adapterons le ratio et les spécifications techniques (ex: 16:9, 9:16).</p>
              {renderGridChoices(destinations, "destination")}
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Quel style visuel préférez-vous ?</h2>
              <p className="text-muted-foreground">Le style définit la patte artistique de votre image.</p>
              {renderGridChoices(styles, "style")}
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
              <h2 className="text-3xl font-bold text-white mb-2">Choix du modèle IA</h2>
              <p className="text-muted-foreground mb-8">Laissez-nous choisir le meilleur modèle pour votre prompt, ou sélectionnez-en un.</p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { id: "auto", name: "Automatique (Recommandé)", icon: Sparkles, desc: "Nous choisissons le meilleur modèle selon votre demande" },
                  { id: "Midjourney", name: "Midjourney v6", icon: ImageIcon, desc: "Idéal pour l'art, le photoréalisme et la créativité" },
                  { id: "DALL-E 3", name: "DALL-E 3", icon: Bot, desc: "Idéal pour le respect strict des consignes et du texte" },
                  { id: "Stable Diffusion", name: "Stable Diffusion XL", icon: Cpu, desc: "Idéal pour la personnalisation extrême" }
                ].map(model => (
                  <button
                    key={model.id}
                    onClick={() => updateForm("aiPreference", model.id)}
                    className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-200
                      ${formData.aiPreference === model.id 
                        ? 'bg-primary/20 border-primary electric-glow' 
                        : 'glass-panel border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <model.icon className={`w-6 h-6 ${formData.aiPreference === model.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-bold text-white">{model.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{model.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="step8" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0">
              <div className="glass-panel p-8 rounded-3xl border border-white/10 electric-border electric-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full blur-3xl -z-10" />
                
                <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <Sparkles className="text-primary w-8 h-8" /> Prêt à générer
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Type</span>
                      <span className="text-white font-medium bg-white/5 px-3 py-1 rounded-lg inline-block">{formData.projectType || "Non spécifié"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Domaine</span>
                      <span className="text-white font-medium bg-white/5 px-3 py-1 rounded-lg inline-block">{formData.niche || "Non spécifié"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Destination</span>
                      <span className="text-white font-medium bg-white/5 px-3 py-1 rounded-lg inline-block">{formData.destination || "Non spécifié"}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Style</span>
                      <span className="text-white font-medium bg-white/5 px-3 py-1 rounded-lg inline-block">{formData.style || "Non spécifié"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Modèle IA</span>
                      <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg inline-block">
                        {formData.aiPreference === "auto" ? "Automatique" : formData.aiPreference}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <span className="text-sm text-muted-foreground block mb-2">Description</span>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-white/90 text-sm leading-relaxed">
                      {formData.description || <span className="italic text-white/30">Aucune description fournie</span>}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white electric-glow rounded-xl"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Générer mon prompt
                </Button>
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key="step9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 relative mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Forge en cours...</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Nos IA analysent votre demande et créent le prompt parfait avec les meilleurs paramètres de rendu.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons (hide on step 8 and 9) */}
      {step < 8 && (
        <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={step === 1}
            className="text-muted-foreground hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={
              (step === 1 && !formData.projectType) ||
              (step === 2 && !formData.niche) ||
              (step === 3 && !formData.description.trim()) ||
              (step === 5 && !formData.destination) ||
              (step === 6 && !formData.style)
            }
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Suivant <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      
      {step === 8 && (
        <div className="flex justify-start mt-8">
          <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Modifier mes choix
          </Button>
        </div>
      )}
    </div>
  );
}