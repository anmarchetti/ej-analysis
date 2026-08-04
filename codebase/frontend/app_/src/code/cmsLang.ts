// use this variable in each place where need to hardcode en language
export const ENGLISH = 'en';
export const ENGLISH_REGION = 'GB';

export type TSitecoreLangs = 'en' | 'ch-fr' | 'ch-de' | 'de' | 'fr';
export type TLangs = 'en' | 'fr' | 'de';
export type TRedion = 'GB' | 'FR' | 'DE' | 'CH';

// Map of lang in url to lang in CMS (sitecore)
const LANG_MAP = {
    en: ENGLISH,
    fr: 'fr-FR',
    de: 'de-DE',
    'ch-fr': 'fr-CH',
    'ch-de': 'de-CH',
    it: 'it-IT',
    es: 'es-ES',
    nl: 'nl-NL',
} as const;

export type TUrlLang = keyof typeof LANG_MAP;
export type TCmsLang = (typeof LANG_MAP)[TUrlLang];

export const AVAILABLE_LANGS: string[] = [ENGLISH, 'fr', 'ch-fr', 'de', 'ch-de'];

/**
 * Returns the CMS (sitecore) language for a given URL language.
 * @param lang - URL lang
 * @param fallbackLang - lang to return if language is not available in CMS
 */
export const getCMSLang = (lang: string, fallbackLang: string = ENGLISH): TCmsLang => LANG_MAP[lang] || fallbackLang;

export const getLangByCMSLang = (lang: string): string | undefined =>
    Object.keys(LANG_MAP).find(k => LANG_MAP[k] === lang);

export const isLanguageAvailableInCMS = (lang: string): boolean => AVAILABLE_LANGS.includes(lang);
