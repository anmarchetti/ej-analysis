import { TrailingZeroDisplay } from 'code/currency';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const useNightsPriceLabel = (offer: Nullable<IOfferWithoutAltBoards>): [string, string] => {
    const { currency, totalPricePPWithTouristTax, formatMoney, getPhrase } = useStore(stores => ({
        totalPricePPWithTouristTax: stores.bookingStore.totalPricePPWithTouristTax,
        currency: stores.amendPaymentStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom);
    const { stay } = offer?.accom || {};
    const totalNights = getDurationLabel(getPhrase, stay);
    const price =
        totalPricePPWithTouristTax &&
        formatMoney(totalPricePPWithTouristTax, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });

    return [totalNights, price ? `${labelBeforePrice}${price}${labelAfterPrice}` : ''];
};
