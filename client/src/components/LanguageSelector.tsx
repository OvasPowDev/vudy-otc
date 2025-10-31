import { Language } from "@/lib/i18n";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector = ({ currentLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const toggleLanguage = () => {
    onLanguageChange(currentLanguage === 'es' ? 'en' : 'es');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
    >
      {currentLanguage === 'es' ? 'EN' : 'ES'}
    </button>
  );
};

export default LanguageSelector;
