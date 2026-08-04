export enum CurrencyCode {
    GBP = 'GBP',
    CHF = 'CHF',
    EUR = 'EUR',
}

export const FORMATTING_NUMBERS_LANG_MAP = {
    en: 'en-GB',
    fr: 'fr-FR',
    de: 'de-DE',
    'ch-fr': 'de-CH',
    'ch-de': 'de-CH',
};

export interface ICurrencyFormatOptions extends Intl.NumberFormatOptions {
    // Custom option to hide currency symbol. Format as decimal number, i.e. 'style':'decimal' is applied
    hideCurrencySymbol?: boolean;
    roundUp?: boolean;
    signDisplay?: SignDisplay;
    // Experimental Intl.NumberFormat option, but it's supported in most browsers.
    // "auto": keep trailing zeros according to 'minimumFractionDigits' and 'minimumSignificantDigits' options.
    // "stripIfInteger": remove the fraction digits if they are all zero
    trailingZeroDisplay?: TrailingZeroDisplay;
}

export enum SignDisplay {
    Always = 'always',
    AUTO = 'auto',
    ExceptZero = 'exceptZero',
}

export enum TrailingZeroDisplay {
    Auto = 'auto',
    StripIfInteger = 'stripIfInteger',
}
