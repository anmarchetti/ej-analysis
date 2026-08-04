import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import { German } from 'flatpickr/dist/l10n/de';
import { english } from 'flatpickr/dist/l10n/default';
import { French } from 'flatpickr/dist/l10n/fr';

import { ENGLISH } from 'code/cmsLang';
import { DAYJS_LOCALES_CONFIG } from 'code/dates';

/**
 * Localize globally all flatpickr instances.
 */
export const localizeFlatpickr = (lang: string): void => {
    const FLATPICKR_LOCALES_CONVERTER = {
        en: english,
        'ch-fr': French,
        'ch-de': German,
        de: German,
        fr: French,
    };

    const flatpickerLocaleConfig = FLATPICKR_LOCALES_CONVERTER[lang];

    flatpickr.localize(flatpickerLocaleConfig || english);
};

/**
 * Set dayjs global locale.
 */
export const localizeDayJS = (lang: string): string => {
    const localeConfig = DAYJS_LOCALES_CONFIG[lang] || DAYJS_LOCALES_CONFIG[ENGLISH];

    localeConfig?.expandLocale?.();

    return dayjs.locale(localeConfig?.key);
};
