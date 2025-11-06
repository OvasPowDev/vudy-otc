import { User } from "@lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, CreditCard, Wallet, Key, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileProps {
  user: User;
  currentLanguage?: string;
}

export function UserProfile({ user, currentLanguage = 'es' }: UserProfileProps) {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const t = (key: string) => {
    const translations = {
      es: {
        menu: {
          profile: "Perfil",
          accounts: "Cuentas",
          wallets: "Wallets",
          api: "API",
        }
      },
      en: {
        menu: {
          profile: "Profile",
          accounts: "Accounts",
          wallets: "Wallets",
          api: "API",
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

  const profileSubmenu = [
    { title: t('menu.profile'), url: "/profile", icon: Settings },
    { title: t('menu.accounts'), url: "/accounts", icon: CreditCard },
    { title: t('menu.wallets'), url: "/wallets", icon: Wallet },
    { title: t('menu.api'), url: "/api-settings", icon: Key },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border cursor-pointer hover:bg-muted transition-colors" 
          data-testid="div-user-profile"
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.email || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Welcome,</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {profileSubmenu.map((item) => (
          <DropdownMenuItem key={item.title} asChild>
            <NavLink
              to={item.url}
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`link-${item.title.toLowerCase()}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
