import React, { FunctionComponent, useEffect } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import StickyHeader from 'frontend/components/common/AmendHotelStickyHeader/StickyHeader';
import AmendPageHeader from 'frontend/components/common/AmendPageHeader/AmendPageHeader';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import HotelBasket from 'frontend/components/renderings/AmendmentBasket/components/HotelBasket/HotelBasket';

import AlternativeHotelsHeader from './components/AlternativeHotelsHeader/AlternativeHotelsHeader';
import AlternativeHotelsList from './components/AlternativeHotelsList/AlternativeHotelsList';
import { IHotelOfferCardFields } from './components/AmendHotelOfferCardFooter/AmendHotelOfferCardFooter';
import AmendHotelsFiltersWrap from './components/AmendHotelsFiltersWrap/AmendHotelsFiltersWrap';
import YourHotelCard from './components/YourHotelCard/YourHotelCard';

import styles from './AmendHotel.module.scss';

interface IAmendHotelSortingFields {
    PriceHighToLow: ISitecoreField<string>;
    PriceLowToHigh: ISitecoreField<string>;
    TripAdvisor: ISitecoreField<string>;
}

interface IAmendHotelEmptyListFields {
    EmptyListDescription: ISitecoreField<string>;
    EmptyListIcon: ISitecoreField<ISitecoreImage>;
    EmptyListTitle: ISitecoreField<string>;
}

export interface IAmendHotelFields extends IHotelOfferCardFields, IAmendHotelSortingFields, IAmendHotelEmptyListFields {
    AlternativeHotelsSubtitle: ISitecoreField<string>;
    AlternativeHotelsTitle: ISitecoreField<string>;
    ChosenHotelTitle: ISitecoreField<string>;
    LoadMoreCTA: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

const AmendHotel: FunctionComponent<ISitecoreComponent<IAmendHotelFields>> = ({ fields, rendering }) => {
    const {
        initializeHotelChangePage,
        booking,
        getPhrase,
        getSetting,
        isLoadingSummaryPage,
        clearHotelSearchResults,
        clearTrackingStoreStore,
        trackHotelListImpressionEvent,
    } = useStore((store: IHolidaysStores) => ({
        initializeHotelChangePage: store.amendHotelStore.initializeHotelChangePage,
        booking: store.viewBookingStore.booking,
        getPhrase: store.layoutStore.getPhrase,
        getSetting: store.layoutStore.getSetting,
        isLoadingSummaryPage: store.amendHotelStore.isLoadingSummaryPage,
        clearHotelSearchResults: store.amendHotelStore.clearHotelSearchResults,
        clearTrackingStoreStore: store.trackingStore.changeHotel.clearStore,
        trackHotelListImpressionEvent: store.trackingStore.changeHotel.trackHotelListImpressionEvent,
    }));
    const isMobile = useMobileViewport();

    useEffect(() => {
        clearTrackingStoreStore();
        initializeHotelChangePage(trackHotelListImpressionEvent);

        return () => {
            clearHotelSearchResults();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!fields) {
        return null;
    }

    const { Title, Subtitle, ChosenHotelTitle } = fields;

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    return (
        <>
            {isLoadingSummaryPage && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.AmendHotelLabelsValidatingHotel)} />
            )}
            {!isMobile && <StickyHeader dataTid='amend-hotel-sticky-header' />}
            <AmendPageHeader title={Title} subtitle={Subtitle} rendering={rendering} isAttentionMessageOn />

            <div className={classNames('wrapper-component-container__inner', styles.content)}>
                <div className={styles.yourHotelSection}>
                    <Text field={ChosenHotelTitle} tag='h2' data-tid='chosen-hotel-title' />

                    {booking && <YourHotelCard booking={booking} fallbackImage={fallbackImage} />}
                </div>
                <AlternativeHotelsHeader fields={fields} />

                <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />
                <div className={styles.changeFeeMargin} />

                <div className={styles.alternativeHotelsSection}>
                    <AmendHotelsFiltersWrap />
                    <AlternativeHotelsList fields={fields} rendering={rendering} fallbackImage={fallbackImage} />
                </div>

                {isMobile && (
                    <Placeholder
                        name={PlaceholderNames.MobileBasket}
                        rendering={rendering}
                        showPrice={false}
                        applyNegativeMargin
                        isStaticFooterIncluded={false}
                    >
                        <HotelBasket />
                    </Placeholder>
                )}
            </div>

            <Placeholder name={PlaceholderNames.UnAvailableFlowPopup} rendering={rendering} />
        </>
    );
};

export default observer(AmendHotel);
