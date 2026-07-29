import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Zap, Shield, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans relative selection:bg-primary/30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <header className="relative z-10 border-b border-white/10 glass-panel">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center electric-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">PromptForge AI</span>
          </div>
          <div className="flex gap-4">
            <Link href="/connexion">
              <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5">
                Connexion
              </Button>
            </Link>
            <Link href="/inscription">
              <Button className="bg-primary hover:bg-primary/90 text-white electric-glow">
                Essayer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            L'assistant créatif ultime
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 leading-tight"
          >
            Maîtrisez l'art de la génération d'images IA
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Obtenez des images époustouflantes sans connaître l'ingénierie de prompt. 
            Laissez PromptForge AI trouver les mots justes pour vous.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link href="/inscription">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white electric-glow rounded-xl gap-2">
                Commencer maintenant <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground sm:ml-4">5 prompts gratuits. Sans carte de crédit.</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-32 grid md:grid-cols-3 gap-8"
        >
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Simple & Rapide</h3>
            <p className="text-muted-foreground leading-relaxed">
              Un processus étape par étape intuitif. Décrivez simplement votre idée, nous générons le prompt parfait pour Midjourney, DALL-E ou Stable Diffusion.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-secondary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-6 text-secondary">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Qualité Pro</h3>
            <p className="text-muted-foreground leading-relaxed">
              Des prompts optimisés par des experts pour garantir des détails époustouflants, un éclairage cinématographique et des compositions parfaites.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-accent/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 text-accent">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Résultats Constants</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sauvegardez vos prompts favoris, conservez un historique complet et dupliquez vos meilleures créations pour maintenir une cohérence visuelle.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}