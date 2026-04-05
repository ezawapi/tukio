import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import translations, { Lang, LANGUAGES } from "@/lib/i18n/translations";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("tukio_language") as Lang;
    return stored && translations[stored] ? stored : "fr";
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("tukio_language", newLang);
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] || translations["fr"]?.[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
export { LANGUAGES };
export type { Lang };
