import { Home, FileText, Settings, LogOut, CreditCard, Plus, Wallet, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/UserProfile";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { TransactionApprovedModal } from "@/components/TransactionApprovedModal";
import { useNotifications } from "@/hooks/useNotifications";
import { Language } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import vudyLogo from "@/assets/Logo_Vudy_OTC.png";
import vudyLogoDark from "@/assets/Logo_Vudy_OTC_Dark.png";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onCreateTransaction?: () => void;
}

const getMenuItems = (t: (key: string) => string) => [
  { title: t('menu.dashboard'), url: "/", icon: Home },
  { title: t('menu.transactions'), url: "/transactions", icon: FileText },
];

const getProfileSubmenu = (t: (key: string) => string) => [
  { title: t('menu.profile'), url: "/profile", icon: Settings },
  { title: t('menu.accounts'), url: "/accounts", icon: CreditCard },
  { title: t('menu.wallets'), url: "/wallets", icon: Wallet },
];

export function AppHeader({ currentLanguage, onLanguageChange, onCreateTransaction }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    selectedNotification,
    markAsRead,
    markAllAsRead,
    toggleDrawer,
    closeModal,
  } = useNotifications();
  
  // Create a simple t function that uses the translations directly
  const t = (key: string) => {
    const translations = {
      es: {
        menu: {
          dashboard: "Dashboard",
          transactions: "Transacciones",
          accounts: "Cuentas",
          wallets: "Wallets",
          profile: "Perfil",
        }
      },
      en: {
        menu: {
          dashboard: "Dashboard",
          transactions: "Transactions",
          accounts: "Accounts",
          wallets: "Wallets",
          profile: "Profile",
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
  const profileSubmenu = getProfileSubmenu(t);
  const location = useLocation();
  
  const isProfileActive = ['/profile', '/accounts', '/wallets'].includes(location.pathname);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.email?.split('@')[0] || "Usuario";

  const handleSignOut = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <header className="h-16 border-b bg-background sticky top-0 z-50" data-testid="header-app">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left - Mobile Menu (Hamburger) + Desktop Logo */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="lg:hidden">
            <MobileMenu 
              user={user}
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
          <img 
            src={isDark ? vudyLogoDark : vudyLogo} 
            alt="VUDY OTC" 
            className="hidden lg:block h-8 sm:h-10 md:h-12" 
            data-testid="img-logo-desktop"
          />
        </div>

        {/* Center - User Name (mobile) / Desktop Navigation */}
        <div className="flex lg:hidden items-center justify-center flex-1 min-w-0">
          <p className="text-sm font-medium truncate" data-testid="text-username-mobile">
            {userName}
          </p>
        </div>
        
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`
              }
              data-testid={`link-${item.title.toLowerCase()}`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.title}</span>
            </NavLink>
          ))}
          
          {/* Profile Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isProfileActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-profile-menu"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">{t('menu.profile')}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
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
        </nav>

        {/* Right - Logo (mobile) / Desktop controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Logo */}
          <img 
            src={isDark ? vudyLogoDark : vudyLogo} 
            alt="VUDY OTC" 
            className="lg:hidden h-8 sm:h-10" 
            data-testid="img-logo-mobile"
          />
          
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-2">
            {onCreateTransaction && (
              <Button
                variant="default"
                size="sm"
                onClick={onCreateTransaction}
                className="gap-2"
                data-testid="button-create-transaction"
              >
                <Plus className="h-4 w-4" />
                <span>{t('createTransaction.title')}</span>
              </Button>
            )}
            <ThemeToggle />
            <LanguageSelector 
              currentLanguage={currentLanguage} 
              onLanguageChange={onLanguageChange} 
            />
            <NotificationBell unreadCount={unreadCount} onClick={toggleDrawer} />
            <UserProfile user={user} />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      <TransactionApprovedModal
        notification={selectedNotification}
        onClose={closeModal}
      />
    </header>
  );
}
