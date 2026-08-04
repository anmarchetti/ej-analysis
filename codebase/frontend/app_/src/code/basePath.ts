import { TUrlLang } from './cmsLang';

export const HOLIDAYS_BASE_PATH: Record<TUrlLang, string> = {
    en: '/en/holidays',
    'ch-fr': '/ch-fr/vacances',
    'ch-de': '/ch-de/ferien',
    it: '/it/vacanze',
    es: '/es/vacaciones',
    de: '/de/urlaub',
    fr: '/fr/vacances',
    nl: '/nl/vakantie',
};

/**
 * Build base path by lang. If lang is not supported, return 'en' base path
 */
export const buildBasePathByLang = (lang: string, isTradePortal: boolean = false): string => {
    const holidaysBasePath = HOLIDAYS_BASE_PATH[lang] ?? HOLIDAYS_BASE_PATH.en;

    return isTradePortal ? `${holidaysBasePath}/trade-portal` : `${holidaysBasePath}`;
};
