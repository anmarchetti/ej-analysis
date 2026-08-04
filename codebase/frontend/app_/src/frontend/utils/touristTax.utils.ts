import { ICurrencyFormatOptions } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { ITouristTax } from 'models/data/ITouristTax';
import { ITouristTaxOfferFields } from 'models/data/ITouristTaxOfferFields';

export const INVALID_TAX_VALUE = -1;

export const getPriceWithTouristTax = (
    price: number,
    priceExcludingTouristTax: number,
    isTaxEnabled: boolean,
): number =>
    // Since we don't know when Atcom will start returning the tourist tax included in the price field for EUX, we will use priceExcludingTouristTax whilst the feature is disabled
    isTaxEnabled ? price : priceExcludingTouristTax;

export const formatMoneyWithTouristTax = (
    price: number,
    priceExcludingTouristTax: number,
    isTaxEnabled: boolean,
    formatMoney: MarketStore['formatMoney'],
    options?: ICurrencyFormatOptions,
): string => {
    const totalPrice = getPriceWithTouristTax(price, priceExcludingTouristTax, isTaxEnabled);

    return formatMoney(totalPrice, options);
};

export const getTouristTaxPrice = (price: number): number => Math.max(0, Math.ceil(price) || 0);

export const getTouristTaxFieldsFromOffer = <T extends Nullable<ITouristTax>>(data: T): ITouristTaxOfferFields => ({
    touristTax: data?.touristTax ?? INVALID_TAX_VALUE,
    touristTaxPP: data?.touristTaxPP ?? INVALID_TAX_VALUE,
    taxesAndFees: data?.taxesAndFees ?? undefined,
});

export const getIsTouristTaxDisplayed = ({
    isTouristTaxEnabled,
    touristTax,
}: {
    isTouristTaxEnabled: boolean;
    touristTax: number;
}): boolean => isTouristTaxEnabled && touristTax !== INVALID_TAX_VALUE;
