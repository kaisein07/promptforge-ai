import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Sparkles, 
  History, 
  Heart, 
  UserCircle, 
  LogOut, 
  ShieldAlert,
  Menu,
  Crown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: Home },
  { href: "/generer", label: "Générer un prompt", icon: Sparkles },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/profil", label: "Mon Profil", icon: UserCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary electric-border border" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="my-4 border-t border-white/10" />
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group cursor-pointer",
                  location === "/admin"
                    ? "bg-destructive/10 text-destructive border border-destructive/50" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldAlert className={cn("w-5 h-5", location === "/admin" ? "text-destructive" : "text-muted-foreground group-hover:text-white")} />
                <span className="font-medium">Administration</span>
              </div>
            </Link>
          </>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-10 w-10 border border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold truncate text-white flex items-center gap-2">
              {user?.name}
              {user?.isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
            </span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-white border-white/10 bg-transparent hover:bg-white/5" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/10 bg-card/50 glass-panel">
        <div className="p-6 border-b border-white/10 flex justify-center items-center">
          <Link href="/tableau-de-bord">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center electric-glow transition-transform group-hover:scale-110">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                PromptForge AI
              </span>
            </div>
          </Link>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <Link href="/tableau-de-bord">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center electric-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">PromptForge</span>
          </div>
        </Link>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 bg-card border-r-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center electric-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PromptForge AI</span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:pl-0 pt-16 md:pt-0 relative overflow-hidden bg-grid">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
        <div className="flex-1 overflow-auto relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}