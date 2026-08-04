import React, { Fragment, FunctionComponent } from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SiteSettings from 'models/enum/SiteSettings';
import OfferCardNew from 'frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew';
import PromoStripe from 'frontend/components/renderings/SearchResults/components/SitecorePlaceholders/PromoStripe';

export interface IOffersPerPageProps {
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders: ISelectOption[];
    offerCardBySelectedIndex: React.RefObject<HTMLDivElement>;
    offers: IOffer[];
    onSetSelectedOfferIndex: (i: number, page?: number) => void;
    page: number;
    rendering: any;
}

/**
 * Render offers and banners between them
 */
const OffersPerPage: FunctionComponent<IOffersPerPageProps> = ({
    rendering,
    offers,
    page,
    offerCardBySelectedIndex,
    onSetSelectedOfferIndex,
    alternativeFlightsDefaultSort,
    alternativeFlightsSortOrders,
}) => {
    const promoStripeRendering = rendering?.placeholders?.[PlaceholderNames.PromoStripe]?.[0] as
        | ComponentRendering
        | undefined;

    /** Index position of Promo Stripe (starts at 1)  */
    const promoStripeIndex = Number(promoStripeRendering?.params?.IndexPosition) || settings.Default.PromoStripeIndex;

    const { getSetting, trackSearchProductClick, isShortlistEnabled, selectedOfferIndex } = useStore(
        (stores: TStores) => ({
            getSetting: stores.layoutStore.getSetting,
            trackSearchProductClick: stores.trackingStore.trackSearchProductClick,
            isShortlistEnabled: isHolidayStore(stores) && stores.shortlistStore.isShortlistEnabled,
            selectedOfferIndex: stores.searchStore.selectedOfferIndex,
        }),
    );

    const promoStripeText = offers.find(offer => !!offer.promotion)?.promotion;

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    return (
        <>
            {offers.map((offer, i) => (
                <Fragment key={`offer-${page}-${i}`}>
                    {/* Insert PromoStripeBanner (EJH-10121) */}
                    {promoStripeText && promoStripeRendering && i === promoStripeIndex - 1 && (
                        <PromoStripe index={i} promo={promoStripeText} rendering={rendering} />
                    )}
                    <OfferCardNew
                        offer={offer}
                        offerIndex={i}
                        fallbackImage={fallbackImage}
                        onSelect={(offer): void => {
                            onSetSelectedOfferIndex(i, page);
                            trackSearchProductClick(offer, i);
                        }}
                        cardRef={(i === selectedOfferIndex && offerCardBySelectedIndex) || undefined}
                        hasShortlistBookmark={isShortlistEnabled}
                        rendering={rendering}
                        alternativeFlightsSortOrders={alternativeFlightsSortOrders}
                        alternativeFlightsDefaultSort={alternativeFlightsDefaultSort}
                    />
                </Fragment>
            ))}
        </>
    );
};

export default OffersPerPage;
