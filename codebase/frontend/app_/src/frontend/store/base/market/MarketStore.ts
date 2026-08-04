import { computed, makeObservable, toJS } from 'mobx';

import { CurrencyCode, FORMATTING_NUMBERS_LANG_MAP, ICurrencyFormatOptions, TrailingZeroDisplay } from 'code/currency';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { findMarketByLang, getCurrencyFromMarket, getDefaultDepositFromMarket } from 'frontend/utils/market.utils';
import { IMarketSettings, MarketCode, TAllMarketsSettings } from 'models/data/MarketSettings';
import SiteSettings from 'models/enum/SiteSettings';

export interface IMarketStoreInitialState {
    allMarketsSettings?: Nullable<TAllMarketsSettings>;
}

interface IMainPriceParts {
    decimal: Intl.NumberFormatPart;
    integer: Intl.NumberFormatPart;
    currency?: Intl.NumberFormatPart;
}
export enum NumberFormatPartTypes {
    Integer = 'integer',
    Decimal = 'decimal',
    Currency = 'currency',
    Literal = 'literal',
    Fraction = 'fraction',
    Group = 'group',
}

export class MarketStore implements ISssrStore<IMarketStoreInitialState> {
    allMarketsSettings: Nullable<TAllMarketsSettings> = null;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    deserialize(initialState?: IMarketStoreInitialState) {
        this.allMarketsSettings = initialState?.allMarketsSettings || null;
    }

    serialize(): IMarketStoreInitialState {
        return {
            allMarketsSettings: toJS(this.allMarketsSettings),
        };
    }

    /** Current market settings (defined by current language) */
    @computed get marketSettings(): Nullable<IMarketSettings> {
        return findMarketByLang(this.rootStore.layoutStore.lang, this.allMarketsSettings);
    }

    /** Current market code (by default UK) */
    @computed get marketCode(): MarketCode {
        return this.rootStore.layoutStore.getSetting(SiteSettings.Market) || MarketCode.UK;
    }

    /**
     * The currency of current market (by default GBP)
     * Please pay attention that most API requests will return currency and it could be different from current market.
     * For example, current market is UK (i.e. GBP currency), but GET /booking returns prices in Swiss Franc.
     * Need to use API currency to format prices, global one is used as fallback.
     */
    @computed get currency(): CurrencyCode {
        return getCurrencyFromMarket(this.marketSettings);
    }

    /**
     * The default deposit price for current market.
     */
    @computed get defaultDepositPrice(): string {
        return this.formatMoney(getDefaultDepositFromMarket(this.marketSettings), { maximumFractionDigits: 0 });
    }

    /**
     * The default deposit price by language.
     */
    getDefaultDepositPrice = (lang: string): string => {
        const marketSettings = findMarketByLang(lang, this.allMarketsSettings);
        const defaultDepositPrice = getDefaultDepositFromMarket(marketSettings);
        const currency = getCurrencyFromMarket(marketSettings);

        return this.formatMoney(defaultDepositPrice, { currency, maximumFractionDigits: 0 });
    };

    /**
     * Get currency formatter Intl.NumberFormat() by provided options.
     * By default the currency of current market is used.
     */
    getCurrencyFormatter = (
        amount: number,
        options?: ICurrencyFormatOptions,
        locales?: string | string[],
    ): Intl.NumberFormat => {
        const currency = options?.currency || this.currency;
        const resLocales =
            locales || FORMATTING_NUMBERS_LANG_MAP[this.rootStore.layoutStore.lang] || FORMATTING_NUMBERS_LANG_MAP.en;

        const hideCurrencySymbol = options?.hideCurrencySymbol;

        const resOptions = {
            ...options,

            // If currency symbol should be hidden, then format it as decimal
            currency: hideCurrencySymbol ? undefined : currency,
            style: hideCurrencySymbol ? 'decimal' : 'currency',
            currencyDisplay: 'narrowSymbol',
        };

        // Polyfill for trailingZeroDisplay option
        // The fraction digits should be removed if they are all zero
        if (resOptions.trailingZeroDisplay === TrailingZeroDisplay.StripIfInteger && amount % 1 === 0) {
            resOptions.minimumFractionDigits = 0;
            resOptions.maximumFractionDigits = 0;
        }

        return new Intl.NumberFormat(resLocales, resOptions);
    };

    /**
     * Get formatting symbol (currency / thousands (group) separator / decimal separator).
     */
    getFormattingSymbol = (
        type: Extract<Intl.NumberFormatPartTypes, 'group' | 'decimal' | 'currency'>,
        currency: CurrencyCode = this.currency,
        locales?: string | string[],
    ) => {
        // Use a number that has thousands and decimal part to get thousands and decimal separators after formatting
        const amount = 1000.1;

        return this.formatMoneyToParts(amount, { currency }, locales).find(p => p.type === type)?.value || '';
    };

    /**
     * Get currency symbol by code (e.g. return '£' for 'GBP')
     */
    getCurrencySymbol = (currency: CurrencyCode = this.currency) => this.getFormattingSymbol('currency', currency);

    /**
     * Check if there is a space between currency and amount.
     */
    checkSpaceBetweenCurrencyAndAmount = (currency: CurrencyCode = this.currency, locales?: string | string[]) =>
        !!this.formatMoney(1, { currency }, locales).match(/(\s\d)|(\d\s)/);

    /**
     * Format currency using Intl.NumberFormat.prototype.format().
     * If currency is not provided in options, the current market currency will be used.
     */
    formatMoney = (amount: number, options?: ICurrencyFormatOptions, locales?: string | string[]): string => {
        if (isNaN(amount)) return '';

        try {
            const formatter = this.getCurrencyFormatter(amount, options, locales);

            if (options?.roundUp) {
                amount = Math.ceil(amount);
            }

            return formatter.format(amount);
        } catch {
            return '';
        }
    };

    /**
     * Format currency in parts using Intl.NumberFormat.prototype.formatToParts() method.
     * Returns an array of objects, e.g [{ type: 'currency', value: '£' }, { type: 'integer', value: '0' }])
     */
    formatMoneyToParts = (
        amount: number,
        options?: ICurrencyFormatOptions,
        locales?: string | string[],
    ): Intl.NumberFormatPart[] => {
        if (isNaN(amount)) return [];

        try {
            const formatter = this.getCurrencyFormatter(amount, options, locales);

            return formatter.formatToParts(amount);
        } catch {
            return [];
        }
    };

    /**
     * Format money to integer and decimal parts.
     * Returns array of two strings, e.g. ['£1,000', '.10']
     */
    formatMoneyToIntegerAndDecimal = (
        amount: number,
        options?: ICurrencyFormatOptions,
        locales?: string | string[],
    ): string[] => {
        const parts = this.formatMoneyToParts(amount, options, locales);
        const decimalIdx = parts.findIndex(p => p.type === 'decimal');

        return parts.reduce(
            (res, part, i) => {
                const resIdx = i < decimalIdx || decimalIdx < 0 ? 0 : 1;
                res[resIdx] += part.value;

                return res;
            },
            ['', ''],
        );
    };

    /**
     * Format money to integer, decimal and currency parts in the correct order.
     * Returns array of three objects, e.g. [{ type: 'currency', value: '£' }, {type: 'integer', value: '1,000' }, { type: 'decimal', value: '.10' }]
     */
    formatMoneyToIntegerAndDecimalWithTypes = (
        amount: number,
        options?: ICurrencyFormatOptions,
        locales?: string | string[],
    ): Intl.NumberFormatPart[] => {
        const priceByParts = this.formatMoneyToParts(amount, options, locales);

        const mainPriceParts: IMainPriceParts = priceByParts.reduce(
            (accum: IMainPriceParts, partOfCurrency) => {
                switch (partOfCurrency.type) {
                    case NumberFormatPartTypes.Currency:
                    case NumberFormatPartTypes.Literal:
                        return Object.assign(accum, {
                            currency: {
                                type: NumberFormatPartTypes.Currency,
                                value: `${accum.currency?.value || ''}${partOfCurrency.value}`,
                            },
                        });

                    case NumberFormatPartTypes.Integer:
                    case NumberFormatPartTypes.Group:
                        return Object.assign(accum, {
                            integer: {
                                type: NumberFormatPartTypes.Integer,
                                value: `${accum.integer.value}${partOfCurrency.value}`,
                            },
                        });

                    case NumberFormatPartTypes.Decimal:
                    case NumberFormatPartTypes.Fraction:
                        return Object.assign(accum, {
                            decimal: {
                                type: NumberFormatPartTypes.Decimal,
                                value: `${accum.decimal.value}${partOfCurrency.value}`,
                            },
                        });

                    default:
                        return accum;
                }
            },
            {
                integer: { type: NumberFormatPartTypes.Integer, value: '' },
                decimal: { type: NumberFormatPartTypes.Decimal, value: '' },
            },
        );

        const { integer, decimal, currency } = mainPriceParts;

        const mainParts: Intl.NumberFormatPart[] = [integer, decimal];

        if (currency?.value) {
            return priceByParts[0]?.type === NumberFormatPartTypes.Currency
                ? [currency].concat(mainParts)
                : mainParts.concat([currency]);
        }

        return mainParts;
    };

    isValidForMarketAirports = (departureAirports: string[]): boolean =>
        departureAirports.every(departureAirport =>
            this.marketSettings?.AirportDepartureCodes?.includes(departureAirport),
        );

    getFormattedNumber = (number: number | string): string => {
        const numberForFormatting = typeof number === 'string' ? Number(number) : number;

        if (!numberForFormatting) {
            return `${number}`;
        }

        const locale = FORMATTING_NUMBERS_LANG_MAP[this.rootStore.layoutStore.lang] || FORMATTING_NUMBERS_LANG_MAP.en;

        return new Intl.NumberFormat(locale).format(numberForFormatting);
    };
}

export default MarketStore;
