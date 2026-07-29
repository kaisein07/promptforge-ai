import { useAuth } from "@/context/auth-context";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Image as ImageIcon, 
  ShoppingBag, 
  Megaphone, 
  Paintbrush,
  Camera,
  BookOpen,
  Layout,
  Shapes,
  Palette
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const projectTypes = [
  { id: "Générer une image", icon: ImageIcon, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "Modifier une image", icon: Paintbrush, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "Photo produit", icon: ShoppingBag, color: "text-green-400", bg: "bg-green-400/10" },
  { id: "Publicité", icon: Megaphone, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "Logo", icon: Shapes, color: "text-pink-400", bg: "bg-pink-400/10" },
  { id: "Portrait réaliste", icon: Camera, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { id: "Personnage manga", icon: Palette, color: "text-red-400", bg: "bg-red-400/10" },
  { id: "Miniature YouTube", icon: Layout, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "Publication Instagram", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { id: "Autre", icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {user?.name?.split(' ')[0] || 'Créateur'} <span className="inline-block animate-float">👋</span>
          </h1>
          <p className="text-muted-foreground text-lg">Que souhaitez-vous créer aujourd'hui ?</p>
        </div>
        <Link href="/generer">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white electric-glow rounded-xl font-semibold gap-2 h-12 px-6">
            <Sparkles className="w-5 h-5" />
            Nouveau Prompt
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <h3 className="text-muted-foreground font-medium mb-1">Prompts générés</h3>
          <p className="text-4xl font-bold text-white">{user?.promptsUsed || 0}</p>
          {!user?.isPremium && (
            <p className="text-xs text-primary mt-2">{5 - (user?.promptsUsed || 0)} restants (Gratuit)</p>
          )}
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
          <h3 className="text-muted-foreground font-medium mb-1">Statut</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {user?.isPremium ? (
              <span className="text-yellow-400 flex items-center gap-2">Premium <Sparkles className="w-5 h-5" /></span>
            ) : (
              <span className="text-white">Gratuit</span>
            )}
          </p>
          {!user?.isPremium && (
            <Link href="/profil">
              <span className="text-xs text-secondary hover:underline mt-2 inline-block cursor-pointer">Passer en Premium</span>
            </Link>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Démarrage rapide par catégorie
        </h2>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {projectTypes.map((type) => (
            <motion.div key={type.id} variants={item}>
              <Link href={`/generer?type=${encodeURIComponent(type.id)}`}>
                <Card className="glass-panel border-white/5 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1 bg-card/40">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${type.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <type.icon className={`w-7 h-7 ${type.color}`} />
                    </div>
                    <span className="font-semibold text-sm text-white/90 group-hover:text-white">{type.id}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}