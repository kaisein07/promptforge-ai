import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast.success("Compte créé avec succès !");
          setLocation("/tableau-de-bord");
        },
        onError: () => {
          toast.error("Erreur lors de la création du compte. Cet email est peut-être déjà utilisé.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-4 pt-16 md:pt-4 relative overflow-x-hidden font-sans bg-grid">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <Link href="/">
        <Button variant="ghost" className="absolute top-8 left-8 text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Button>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center cyan-glow mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Créer un compte</h1>
            <p className="text-muted-foreground text-center">
              Rejoignez-nous et commencez à générer des prompts professionnels.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nom complet</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe"
                        autoComplete="name"
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="vous@exemple.com"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Mot de passe</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••" 
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground cyan-glow rounded-xl mt-4"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link href="/connexion">
                <span className="text-secondary hover:text-secondary/80 font-medium cursor-pointer transition-colors">
                  Se connecter
                </span>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}