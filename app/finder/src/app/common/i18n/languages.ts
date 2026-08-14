export const LANGUAGE_STORAGE_KEY = 'language';

export const SUPPORTED_LANGUAGES = ['en', 'de', 'es'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function getStoredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
    ? (stored as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function detectBrowserLanguage(): SupportedLanguage {
  const prefix = (navigator.language ?? '').split('-')[0].toLowerCase();
  if (prefix === 'de') { return 'de'; }
  if (prefix === 'es') { return 'es'; }
  return 'en';
}
