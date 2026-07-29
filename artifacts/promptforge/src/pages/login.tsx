import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useLogin } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast.success("Connexion réussie !");
          setLocation("/tableau-de-bord");
        },
        onError: () => {
          toast.error("Email ou mot de passe incorrect");
        },
      }
    );
  };

  // Hardcode credentials logic helper
  const fillAdminCredentials = () => {
    form.setValue("email", "babioabdoul93@gmail.com");
    form.setValue("password", "admin123"); // assuming standard dev password
  };

  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-4 pt-16 md:pt-4 relative overflow-x-hidden font-sans bg-grid">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center electric-glow mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
            <p className="text-muted-foreground text-center">
              Connectez-vous pour accéder à vos prompts et créer la magie.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
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
                        autoComplete="current-password"
                        placeholder="••••••••" 
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white electric-glow rounded-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/inscription">
                <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">
                  S'inscrire
                </span>
              </Link>
            </p>
            <div className="mt-4">
              <button onClick={fillAdminCredentials} className="text-xs text-white/30 hover:text-white/70 transition-colors">
                (Remplir démo admin)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}