import en from "@/locales/en.json";
import ja from "@/locales/ja.json";
import zh from "@/locales/zh.json";

export type Language = "EN" | "JA" | "ZH";
export type Currency = "USD" | "JPY" | "CNY";

export type TranslationDictionary = typeof en;

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  EN: en,
  JA: ja,
  ZH: zh,
};
