import React, { FC } from 'react';

import { ENGLISH, getLangByCMSLang } from 'code/cmsLang';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isShortlistedOfferUnavailableForBooking } from 'frontend/utils/shortlist.utils';
import { removeSpacesFromString } from 'frontend/utils/string.utils';
import { getShortlistOfferIdentifier } from 'frontend/utils/tracking/comparisonTable.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import OfferPriceButton from 'frontend/components/common/OfferPriceButton/OfferPriceButton';
import { IOfferWithActionFields } from 'frontend/components/renderings/CompareDeals/stores/CompareStore';

export interface ICompareOfferButtonProps {
    offer: IOfferWithActionFields;
}

const CompareOfferButton: FC<ICompareOfferButtonProps> = ({ offer }) => {
    const { trackEventWithParams, sitePath, isOfferFromAnotherMarket, getSitePathInLang, pageTitle, pageName } =
        useStore((stores: TStores) => ({
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
            sitePath: stores.layoutStore.sitePath,
            isOfferFromAnotherMarket: isHolidayStore(stores)
                ? stores.shortlistStore.isOfferFromAnotherMarket
                : (): boolean => false,
            getSitePathInLang: stores.layoutStore.getSitePathInLang,
            pageTitle: stores.trackingStore.pageTitle,
            pageName: stores.trackingStore.pageName,
        }));

    const onClick = (): void => {
        offer.onClickViewHoliday();

        const isAnotherMarketOffer = isOfferFromAnotherMarket(offer);
        const offerLang = getLangByCMSLang(offer.shortlist?.language || ENGLISH) || ENGLISH;
        const sitePathInOfferLang = getSitePathInLang(offerLang);
        const page = removeSpacesFromString(pageTitle).toLowerCase();

        const buttonLabel = isShortlistedOfferUnavailableForBooking(offer)
            ? EventLabels.CheckAvailability
            : EventLabels.ViewHoliday;

        const customParams = generateGenericValues({
            genericValue1: getShortlistOfferIdentifier(offer),
            destinationUrl: isAnotherMarketOffer ? `${sitePathInOfferLang}${offer.link}` : `${sitePath}${offer.link}`,
        });

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Shortlist,
                eventAction: pageName,
                eventLabel: buttonLabel,
                eventType: EventTypes.Interaction,
            },
            customParams,
            undefined,
            undefined,
            { pageUrl: `${sitePath}/${page}${SitePath.Compare}` },
        );
    };

    return (
        <OfferPriceButton
            link={offer.link}
            offer={offer}
            isLivePrice={!!offer.livePrice}
            onClick={onClick}
            asLink={offer.asLink}
        />
    );
};

export default CompareOfferButton;
