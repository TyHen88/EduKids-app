"use client";
import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "./dictionaries";

type DictionaryContextType = {
  dictionary: Dictionary;
  lang: Locale;
};

const DictionaryContext = createContext<DictionaryContextType | null>(null);

export const DictionaryProvider = ({
  dictionary,
  lang,
  children,
}: {
  dictionary: Dictionary;
  lang: Locale;
  children: React.ReactNode;
}) => (
  <DictionaryContext.Provider value={{ dictionary, lang }}>
    {children}
  </DictionaryContext.Provider>
);

export const useDictionary = (): Dictionary => {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error("useDictionary must be used within DictionaryProvider");
  return ctx.dictionary;
};

export const useLocale = (): Locale => {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error("useLocale must be used within DictionaryProvider");
  return ctx.lang;
};
