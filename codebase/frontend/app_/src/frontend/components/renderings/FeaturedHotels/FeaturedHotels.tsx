import React, { FC, useEffect, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
    getTextPositionClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { getDestinationLivePriceByCode } from 'frontend/utils/livePrice.utils';
import { ICustomisableTitleAndDescriptionParams } from 'models/data/ICustomisableComponentParams';
import { FeaturedHotelsMaxItems, IFeaturedHotel, IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import FeaturedHotelCard from './components/FeaturedHotelCard';
import FeaturedHotelsRenderHelper from './components/FeaturedHotelsRenderHelper';

import styles from './FeaturedHotels.module.scss';

interface IFeaturedHotelsSitecoreFields {
    Description: ISitecoreField<string>;
    EnableNumberOfNights: ISitecoreField<boolean>;
    FeaturedHotels: IFeaturedHotel[];
    Title: ISitecoreField<string>;
}
export type TFeaturedHotelsProps = ISitecoreComponent<
    IFeaturedHotelsSitecoreFields,
    ICustomisableTitleAndDescriptionParams
>;

export const FeaturedHotels: FC<TFeaturedHotelsProps> = ({ fields, params, rendering }) => {
    const {
        getLivePrice,
        isFeaturedHotelsLivePriceEnabled,
        isHomePage,
        getSetting,
        isNumberOfNightsLabelsEnabled,
        trackFeaturedHotelsImpression,
        trackPersonalizedClick,
        isTouristTaxEnabled,
        getPhrase,
    } = useStore((stores: TStores) => ({
        getLivePrice: stores.hotelsStore.getLivePrice,
        isFeaturedHotelsLivePriceEnabled: stores.layoutStore.isFeaturedHotelsLivePriceEnabled,
        isHomePage: stores.layoutStore.isHomePage,
        getSetting: stores.layoutStore.getSetting,
        isNumberOfNightsLabelsEnabled: stores.layoutStore.isNumberOfNightsLabelsEnabled,
        trackFeaturedHotelsImpression: stores.trackingStore.trackFeaturedHotelsImpression,
        trackPersonalizedClick: stores.trackingStore.trackPersonalizedClick,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();
    const [prices, setPrices] = useState<ILivePrice[]>([]);

    const loadPrices = async () => {
        const livePrices = await getLivePrice(
            (fields?.FeaturedHotels || []).map(item => item.GiataCode),
            true,
            true,
            true,
        );

        setPrices(livePrices);
    };

    useEffect(() => {
        // This component is wrapped in withRerender().
        // To avoid duplicate api calls, make request only if component was rerendered.
        isFeaturedHotelsLivePriceEnabled && loadPrices();
    }, [fields?.FeaturedHotels]);

    const hotels = fields?.FeaturedHotels || [];
    const hotelsWithPrices = useMemo(
        () =>
            hotels.map(item => {
                const livePrice = getDestinationLivePriceByCode(item.GiataCode, prices);

                return {
                    ...item,
                    livePrice,
                    isPriceValid: !!livePrice?.pricePP,
                };
            }),
        [hotels, prices],
    );

    const isTouristTaxTooltipDisplayed = useMemo(
        () => hotelsWithPrices.some(hotel => hotel.isPriceValid),
        [hotelsWithPrices],
    );

    if (!fields?.FeaturedHotels.length) {
        return null;
    }

    const isShowCarousel = isMobile
        ? hotels.length > FeaturedHotelsMaxItems.Small
        : hotels.length > FeaturedHotelsMaxItems.Big;

    const isTouristTaxShown =
        isTouristTaxEnabled && isFeaturedHotelsLivePriceEnabled && prices.length > 0 && isTouristTaxTooltipDisplayed;

    const trackComponent = (inView: boolean): void => {
        if (!isHomePage || !inView || !hotelsWithPrices) return;

        trackFeaturedHotelsImpression(rendering?.uid, hotelsWithPrices);
    };

    const handleClickHotel = (index: number, item: IFeaturedHotelsWithPrice, destination: string): void => {
        trackPersonalizedClick(
            EventTypes.FeaturedHotelsModule,
            rendering?.uid,
            fields?.Title?.value || '',
            item.Name,
            destination,
            { position: `${index + 1}`, price: `${item.livePrice?.pricePP || 'No price displayed'}` },
        );
    };

    const displayNumberOfNights = isNumberOfNightsLabelsEnabled && !!fields.EnableNumberOfNights?.value;
    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const wrapperClassName = classNames('featured-hotels-block', getPaddingSizeClassName(params?.PaddingSize));
    const titleClassName = getCustomisableTitleClassName('text-block__header text-block__header--centered', params);
    const descriptionClassName = classNames(
        'text-block__description text-block__description--centered',
        getTextPositionClassName(params?.DescriptionPosition),
    );

    return (
        <div className={wrapperClassName} data-tid='featured-hotels-block'>
            <div className='text-block' data-tid='text-block'>
                <Text
                    field={fields.Title}
                    tag={params?.TitleTag || 'h2'}
                    className={titleClassName}
                    data-tid='text-block-header'
                />

                <RichText
                    field={fields.Description}
                    className={descriptionClassName}
                    data-tid='text-block-description'
                />
            </div>
            <InView onChange={inView => trackComponent(inView)} triggerOnce>
                {fields.FeaturedHotels.length === 1 ? (
                    <FeaturedHotelCard
                        fallbackImage={fallbackImage || ''}
                        hotel={hotelsWithPrices[0]}
                        onClick={(item, destination) => handleClickHotel(0, item, destination)}
                        displayNumberOfNights={displayNumberOfNights}
                    />
                ) : (
                    <FeaturedHotelsRenderHelper
                        isShowCarousel={isShowCarousel}
                        fallbackImage={fallbackImage || ''}
                        hotelsWithPrices={hotelsWithPrices}
                        handleClickHotel={handleClickHotel}
                        displayNumberOfNights={displayNumberOfNights}
                    />
                )}
                {isTouristTaxShown && (
                    <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                        <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                    </TouristTaxGenericTooltip>
                )}
            </InView>
        </div>
    );
};

export default observer(FeaturedHotels);
