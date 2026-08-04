import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTotalDiscount, isFreeForKids } from 'frontend/utils/offer.utils';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import SiteSettings from 'models/enum/SiteSettings';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import HotelDiscountPill from 'frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill';
import { withRerender } from 'frontend/components/hoc';
import HotelDeposit from 'frontend/components/renderings/SearchResults/components/HotelDeposit';

export enum OffersViewMode {
    AllOffers = 'AllOffers',
    TwoOffers = 'TwoOffers',
}
export interface IBasketPriceCellOffersProps {
    isPricePPShown: boolean;
    offer: IOffer | IOfferWithoutAltBoards;
    viewMode?: OffersViewMode;
}

export const BasketPriceCellOffers: FC<IBasketPriceCellOffersProps> = ({ offer, isPricePPShown, viewMode }) => {
    const { isPillVisible, currency } = useStore(({ layoutStore, bookingStore }: TStores) => ({
        isPillVisible: layoutStore.isPillVisible,
        currency: bookingStore.currency,
    }));

    const countryCode = offer?.hotel?.country?.code || '';

    const totalDiscount = isPillVisible(SiteSettings.DiscountPill, countryCode) &&
        offer &&
        getTotalDiscount(offer) > 0 && (
            <HotelDiscountPill
                isSmall
                amount={getTotalDiscount(offer)}
                key='totalDiscount'
                countryCode={countryCode}
                currency={currency}
            />
        );

    const deposit = isPillVisible(SiteSettings.DepositPill, countryCode) && !!offer?.deposit && offer.deposit > 0 && (
        <HotelDeposit isSmall key='deposit' countryCode={countryCode} offer={offer} isPricePPShown={isPricePPShown} />
    );

    const kidsGoFree = isPillVisible(SiteSettings.FreeForKidsPill, countryCode) && isFreeForKids(offer) && (
        <FreeForKidsPill isSmall key='kidsGoFree' countryCode={countryCode} />
    );

    const basketOffers: React.ReactNode[] = [];

    totalDiscount && basketOffers.push(totalDiscount);
    deposit && basketOffers.push(deposit);
    kidsGoFree && basketOffers.push(kidsGoFree);

    switch (viewMode) {
        case OffersViewMode.AllOffers:
            return <>{basketOffers}</>;
        case OffersViewMode.TwoOffers:
            return <>{basketOffers.slice(0, 2)}</>;
        default:
            return null;
    }
};

export default withRerender(observer(BasketPriceCellOffers));
