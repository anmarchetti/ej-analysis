import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import Axios, { CancelTokenSource } from 'axios';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import { isHolidayStore } from 'frontend/store/holidays';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { IRecommendedHotelsFields, IRecommendedHotelsParams } from 'models/data/IRecommendedHotels';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { DataStatus, isLoadingStatus, isNotLoadedStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { RecommendedType } from 'models/enum/RecommendedType';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import RecommendedHotelsCarousel from 'frontend/components/common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel';

export interface IRecommendedHotelsProps
    extends ISitecoreComponent<IRecommendedHotelsFields, IRecommendedHotelsParams>,
        IComponentWithDictionary {
    title: string;
    withoutPadding?: boolean;
}

export const GenericRecommendedHotels: FunctionComponent<Partial<IRecommendedHotelsProps>> = ({
    fields,
    params,
    rendering,
    title,
    withoutPadding,
}) => {
    const {
        isMaintenance,
        isLivePriceEnabled,
        isPromoPage,
        isNotFoundPage,
        prevPath,
        setBd4RecommenderPlacementId,
        setBd4RecommenderTracking,
        trackRecommenderNotLoaded,
        isHolidayTypePage,
        isHolidayTypeRecommenderCarouselEnabled,
        holidayThemeTypes,
        promoCollections,
        getSetting,
        pageName,
        isCancelledBookingPage,
        booking,
    } = useStore(stores => ({
        isMaintenance: stores.layoutStore.isMaintenance,
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        prevPath: stores.layoutStore.prevPath,
        setBd4RecommenderPlacementId: stores.trackingStore.setBd4RecommenderPlacementId,
        setBd4RecommenderTracking: stores.trackingStore.setBd4RecommenderTracking,
        trackRecommenderNotLoaded: stores.trackingStore.trackRecommenderNotLoaded,
        isPromoPage: stores.layoutStore.isPromoPage,
        isNotFoundPage: stores.layoutStore.isNotFoundPage,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        isHolidayTypeRecommenderCarouselEnabled: stores.layoutStore.isHolidayTypeRecommenderCarouselEnabled,
        holidayThemeTypes: stores.layoutStore.holidayThemeTypes,
        promoCollections: stores.layoutStore.promoCollections,
        getSetting: stores.layoutStore.getSetting,
        pageName: stores.layoutStore.pageName,
        isCancelledBookingPage: isHolidayStore(stores) ? stores.viewBookingStore.isCancelledBookingPage : false,
        booking: isHolidayStore(stores) ? stores.viewBookingStore.booking : undefined,
    }));
    const minNumberOfHotels = Number(params?.MinimumNumberSlider);
    const maxNumberOfHotels = Number(params?.MaximumNumberSlider);
    const isLeftAligned = isSitecoreCheckboxSelected(params?.IsLeftAligned);
    const openLinksInNewTab = isSitecoreCheckboxSelected(params?.OpenLinksInNewTab);
    const displaySponsoredLabel = isSitecoreCheckboxSelected(params?.DisplaySponsoredLabel);
    const showSponsoredHotelsOnly = isSitecoreCheckboxSelected(params?.ShowSponsoredHotelsOnly);
    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const [recommendedHotels, setRecommendedHotels] = useState<IOffer[]>([]);
    const [status, setStatus] = useState(DataStatus.NotLoaded);
    const isMounted = useRef(false);
    const cancelToken = useRef<Nullable<CancelTokenSource>>(null);
    const hideComponent = isMaintenance || (isCancelledBookingPage && booking?.isExternalAgency);

    const getPlacementId = (prevPath): Nullable<Bd4TravelPlacementId> => {
        if (fields?.BD4PlacementId?.value) {
            return fields.BD4PlacementId.value;
        }

        if (isNotFoundPage) {
            return prevPath ? Bd4TravelPlacementId.NotFoundPageInternal : Bd4TravelPlacementId.NotFoundPageExternal;
        }

        if (isPromoPage) {
            return prevPath ? Bd4TravelPlacementId.PromoPageErrorInternal : Bd4TravelPlacementId.PromoPageErrorExternal;
        }

        return null;
    };

    const loadRecommendedHotels = async () => {
        const placementId = getPlacementId(prevPath);

        if (!placementId || (isHolidayTypePage && !isHolidayTypeRecommenderCarouselEnabled)) {
            return;
        }

        setStatus(DataStatus.Loading);
        setBd4RecommenderPlacementId(placementId);

        try {
            cancelToken.current = Axios.CancelToken.source();

            const res = await offersService.fetchGenericRecommendedOffers(
                placementId,
                pageName,
                true,
                isLivePriceEnabled,
                [...holidayThemeTypes, ...promoCollections].join(','),
                cancelToken.current,
            );

            if (!isMounted.current) {
                return;
            }

            setBd4RecommenderTracking(res?.status?.tracking);

            const allOffers = res?.offers ?? [];
            const offers = showSponsoredHotelsOnly ? allOffers.filter(offer => offer.isSponsored) : allOffers;

            const total = offers.length;

            if (total > 0 && (!minNumberOfHotels || total >= minNumberOfHotels)) {
                setRecommendedHotels(offers);
            } else {
                trackRecommenderNotLoaded();
            }

            setStatus(DataStatus.Loaded);
        } catch (e) {
            if (!Axios.isCancel(e) && isMounted.current) {
                trackRecommenderNotLoaded(e?.message);
                setStatus(DataStatus.Error);
            }
        }
    };

    useEffect(() => {
        if (!hideComponent) {
            isMounted.current = true;
            loadRecommendedHotels();
        }

        return () => {
            isMounted.current = false;
            cancelToken.current?.cancel();
        };
    }, []);

    if (hideComponent) {
        return null;
    }

    if (recommendedHotels.length || isLoadingStatus(status) || isNotLoadedStatus(status)) {
        return (
            <RecommendedHotelsCarousel
                offers={recommendedHotels}
                livePrices={recommendedHotels.map(x => x.livePrice).filter(x => !!x) as ILivePrice[]}
                onSelectedOffer={() => {}}
                fallbackImage={fallbackImage}
                title={fields?.Title?.value || title || ''}
                numberOfShowItem={maxNumberOfHotels || recommendedHotels.length}
                recommendedType={RecommendedType.Generic}
                isSlimCardsDesign
                withoutPadding={withoutPadding}
                openLinksInNewTab={openLinksInNewTab}
                isLeftAligned={isLeftAligned}
                fields={fields}
                displaySponsoredLabel={displaySponsoredLabel}
            />
        );
    }

    // Render fallback content if no recommended hotels
    return rendering ? <Placeholder name={PlaceholderNames.RecommendedHotelsFallback} rendering={rendering} /> : null;
};

export default observer(GenericRecommendedHotels);
