import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { lang, setLang } = useTranslation();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setLang(lang === "en" ? "ru" : "en")}
      className="gap-1.5 text-xs font-medium"
      data-testid="button-language-toggle"
    >
      <Globe className="h-4 w-4" />
      {lang === "en" ? "RU" : "EN"}
    </Button>
  );
}
