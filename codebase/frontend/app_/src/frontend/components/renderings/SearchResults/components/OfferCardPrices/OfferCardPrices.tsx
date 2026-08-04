import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { getActualPrice } from 'frontend/utils/livePrice.utils';
import { getPricePill, getTotalDiscount, getTotalDiscountPPExcludingInfants } from 'frontend/utils/offer.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OfferCardPriceItem from './OfferCardPriceItem';

export interface IOfferCardPricesProps {
    offer: IOffer;
    isCarouselCard?: boolean;
    livePrice?: Nullable<ILivePrice>;
    shouldDisplayStrikethroughPrices?: boolean;
}

export const OfferCardPrices: FC<IOfferCardPricesProps> = ({
    offer,
    livePrice,
    isCarouselCard,
    shouldDisplayStrikethroughPrices = false,
}) => {
    const {
        isPriceViewToggleEnabled,
        isOffersPriceViewTotal,
        isPromoPage,
        isSearchResultsPage,
        isShortlistPage,
        isAnyShortlistMultiplePersonOfferNotExpired,
        tooltipSettings,
    } = useStore(stores => ({
        isPriceViewToggleEnabled: stores.layoutStore.isPriceViewToggleEnabled,
        isOffersPriceViewTotal: stores.layoutStore.isOffersPriceViewTotal,
        isPromoPage: stores.layoutStore.isPromoPage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isShortlistPage: stores.layoutStore.isShortlistPage,
        isAnyShortlistMultiplePersonOfferNotExpired:
            isHolidayStore(stores) && stores.shortlistStore.isAnyShortlistMultiplePersonOfferNotExpired,
        tooltipSettings: stores.layoutStore.tooltipSettings,
    }));

    const currency = offer.currency?.code;
    const { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax } = getActualPrice(livePrice, offer);
    const priceFields = { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax };
    const tooltipMessage = getPricePill(tooltipSettings, offer);
    const discount = Math.ceil(getTotalDiscount(offer));
    const discountPP = Math.ceil(getTotalDiscountPPExcludingInfants(offer));
    const touristTaxFields = getTouristTaxFieldsFromOffer(offer);

    const isPriceDefinedByToggle = (() => {
        if (isCarouselCard || !isPriceViewToggleEnabled) {
            return false;
        }

        if (isShortlistPage) {
            return isAnyShortlistMultiplePersonOfferNotExpired;
        }

        if (isSearchResultsPage || isPromoPage) {
            return price !== pricePP;
        }

        return false;
    })();

    if (isPriceDefinedByToggle) {
        const [totalDiscount, priceDictionary] = isOffersPriceViewTotal
            ? [discount, SitecoreDictionary.GlobalsPriceLabelsTotalFrom]
            : [discountPP, SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom];

        return (
            <div className='hotel-price__main'>
                <OfferCardPriceItem
                    className='total'
                    priceDictionary={priceDictionary}
                    currency={currency}
                    tooltipMessage={tooltipMessage}
                    discount={shouldDisplayStrikethroughPrices ? totalDiscount : 0}
                    isPricePP={!isOffersPriceViewTotal}
                    {...touristTaxFields}
                    {...priceFields}
                />
            </div>
        );
    }

    const isPricePPShown = price !== pricePP;

    return (
        <div className='hotel-price__main'>
            <OfferCardPriceItem
                className='total'
                priceDictionary={isPricePPShown ? undefined : SitecoreDictionary.GlobalsPriceLabelsFrom}
                currency={currency}
                tooltipMessage={isPricePPShown ? undefined : tooltipMessage}
                discount={shouldDisplayStrikethroughPrices ? discount : 0}
                isPricePP={false}
                {...touristTaxFields}
                {...priceFields}
            />

            {isPricePPShown && (
                <OfferCardPriceItem
                    className='subprice'
                    priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                    currency={currency}
                    tooltipMessage={tooltipMessage}
                    discount={shouldDisplayStrikethroughPrices ? discountPP : 0}
                    isPricePP
                    {...touristTaxFields}
                    {...priceFields}
                />
            )}
        </div>
    );
};

export default observer(OfferCardPrices);
