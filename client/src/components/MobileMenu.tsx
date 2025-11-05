import { Home, FileText, Settings, LogOut, Moon, Sun, CreditCard, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { User } from "@lib/auth";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Language } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  user: User;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const getMenuItems = (t: (key: string) => string) => [
  { title: t('menu.dashboard'), url: "/", icon: Home },
  { title: t('menu.transactions'), url: "/transactions", icon: FileText },
  { title: t('menu.accounts'), url: "/accounts", icon: CreditCard },
  { title: t('menu.wallets'), url: "/wallets", icon: Wallet },
  { title: t('menu.profile'), url: "/profile", icon: Settings },
];

export function MobileMenu({ user, currentLanguage, onLanguageChange }: MobileMenuProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Create a simple t function that uses the translations directly
  const t = (key: string) => {
    const translations = {
      es: {
        menu: {
          menu: "Menú",
          user: "Usuario",
          dashboard: "Dashboard",
          transactions: "Transacciones",
          accounts: "Cuentas",
          wallets: "Wallets",
          profile: "Perfil",
          settings: "Configuración",
          theme: "Tema",
          light: "Claro",
          dark: "Oscuro",
          language: "Idioma",
          signOut: "Cerrar sesión",
        }
      },
      en: {
        menu: {
          menu: "Menu",
          user: "User",
          dashboard: "Dashboard",
          transactions: "Transactions",
          accounts: "Accounts",
          wallets: "Wallets",
          profile: "Profile",
          settings: "Settings",
          theme: "Theme",
          light: "Light",
          dark: "Dark",
          language: "Language",
          signOut: "Sign Out",
        }
      }
    };
    
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
  
  const menuItems = getMenuItems(t);

  useEffect(() => {
    const checkTheme = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLanguage = () => {
    onLanguageChange(currentLanguage === 'es' ? 'en' : 'es');
  };

  const handleSignOut = () => {
    logout();
    setOpen(false);
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>{t('menu.menu')}</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 py-6">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.email || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">{t('menu.user')}</p>
            </div>
          </div>

          <Separator />

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.title}</span>
              </NavLink>
            ))}
          </nav>

          <Separator />

          {/* Settings */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-1">
              {t('menu.settings')}
            </p>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{t('menu.theme')}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {theme === "light" ? t('menu.light') : t('menu.dark')}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t('menu.language')}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentLanguage === 'es' ? 'Español' : 'English'}
              </span>
            </button>
          </div>

          <Separator />

          {/* Sign Out */}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('menu.signOut')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
