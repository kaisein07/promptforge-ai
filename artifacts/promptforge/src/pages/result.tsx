import { useRoute, Link, useLocation } from "wouter";
import { useGetPrompt, useToggleFavorite, useSubmitFeedback } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Copy, Download, Heart, RefreshCw, Sparkles, Check,
  ThumbsUp, ThumbsDown, Loader2, Wand2, Info, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function Result() {
  const [, params] = useRoute("/resultat/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0", 10);

  const { data: prompt, isLoading, error } = useGetPrompt(id, {
    query: {
      enabled: id > 0,
      queryKey: ["prompt", id]
    }
  });

  const toggleFavoriteMutation = useToggleFavorite();
  const submitFeedbackMutation = useSubmitFeedback();

  const [copied, setCopied] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showFeedbackComment, setShowFeedbackComment] = useState<"positive" | "negative" | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Prompt introuvable</h2>
        <Link href="/tableau-de-bord">
          <Button variant="outline" className="border-white/10">Retour au tableau de bord</Button>
        </Link>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.generatedText);
    setCopied(true);
    toast.success("Prompt copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([prompt.generatedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `prompt_${prompt.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate({ id }, {
      onSuccess: (data) => {
        toast.success(data.isFavorite ? "Ajouté aux favoris" : "Retiré des favoris");
      }
    });
  };

  const handleFeedback = (type: "positive" | "negative", submitComment = false) => {
    if (!submitComment && !prompt.feedback) {
      setShowFeedbackComment(type);
      return;
    }

    submitFeedbackMutation.mutate({
      id,
      data: {
        feedback: showFeedbackComment || type,
        comment: feedbackComment || null
      }
    }, {
      onSuccess: () => {
        toast.success("Merci pour votre retour !");
        setShowFeedbackComment(null);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/tableau-de-bord">
          <Button variant="ghost" className="text-muted-foreground hover:text-white -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Tableau de bord
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground">
            Modèle ciblé : <span className="text-white">{prompt.aiTool}</span>
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-1 rounded-3xl border border-white/10 electric-glow bg-gradient-to-b from-white/5 to-transparent">
            <div className="bg-[#0f0f13] rounded-[22px] p-6 md:p-8 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Votre Prompt Optimisé</h2>
                    <p className="text-sm text-muted-foreground">Copiez et collez ce texte dans votre outil d'IA</p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black/50 border border-white/10 rounded-xl p-6 font-mono text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap select-all">
                  {prompt.generatedText}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Button 
                  onClick={handleCopy} 
                  className="bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copié !" : "Copier le prompt"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDownload}
                  className="border-white/10 hover:bg-white/5 text-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Télécharger (.txt)
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleToggleFavorite}
                  className={`border-white/10 hover:bg-white/5 ${prompt.isFavorite ? 'text-pink-500' : 'text-white'}`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                  {prompt.isFavorite ? "Favori" : "Ajouter aux favoris"}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => setLocation(`/generer?type=${prompt.projectType}`)}
                  className="border-white/10 hover:bg-white/5 text-white ml-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Nouveau
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-medium text-white mb-4">Ce prompt vous a-t-il été utile ?</h3>
            
            {!showFeedbackComment ? (
              <div className="flex gap-4">
                <Button 
                  variant={prompt.feedback === "positive" ? "default" : "outline"} 
                  onClick={() => handleFeedback("positive")}
                  className={prompt.feedback === "positive" ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50" : "border-white/10"}
                >
                  👍 Oui, super
                </Button>
                <Button 
                  variant={prompt.feedback === "negative" ? "default" : "outline"} 
                  onClick={() => handleFeedback("negative")}
                  className={prompt.feedback === "negative" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50" : "border-white/10"}
                >
                  👎 Non, à améliorer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea 
                  placeholder="Dites-nous pourquoi (optionnel)..." 
                  className="bg-black/30 border-white/10 text-white"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleFeedback(showFeedbackComment, true)} className="bg-primary text-white">
                    Envoyer
                  </Button>
                  <Button variant="ghost" onClick={() => setShowFeedbackComment(null)} className="text-muted-foreground">
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-secondary" />
              Conseils de l'IA
            </h3>
            <div className="prose prose-invert prose-sm">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {prompt.aiTips || "Pour de meilleurs résultats, n'hésitez pas à modifier quelques mots-clés du prompt (comme les couleurs ou le format) pour ajuster finement le résultat sur l'outil cible."}
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Résumé de la requête</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-muted-foreground text-sm">Type</span>
                <span className="text-white font-medium text-sm">{prompt.projectType}</span>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-muted-foreground text-sm">Domaine</span>
                <span className="text-white font-medium text-sm">{prompt.niche}</span>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-muted-foreground text-sm">Destination</span>
                <span className="text-white font-medium text-sm">{prompt.destination}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Style</span>
                <span className="text-white font-medium text-sm">{prompt.style}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}