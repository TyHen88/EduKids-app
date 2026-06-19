import "server-only";

export const locales = ["km", "en"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "km";

export const hasLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale);

export const getDictionary = async (locale: Locale) => {
  if (locale === "en") {
    return (await import("./dictionaries/en.json")).default;
  }
  // fallback to Khmer
  return (await import("./dictionaries/kh.json")).default;
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
