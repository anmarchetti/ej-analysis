import React, { FC, useEffect, useMemo, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import { useIsMounted } from 'frontend/hooks/useIsMounted';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDestinationLivePriceByCode } from 'frontend/utils/livePrice.utils';
import { IExcludedDestinations, IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import { ILivePrice } from 'models/data/ILivePrice';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ITouristTax } from 'models/data/ITouristTax';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IDestinationAvailability } from 'models/IDestinationsAvailability';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import MasonryItem from './components/MasonryItem/MasonryItem';
import OneRowTemplate from './components/OneRowTemplate';
import TwoColumnsTemplate from './components/TwoColumnsTemplate';
import TwoRowsTemplate from './components/TwoRowsTemplate';

import styles from './MasonryCarousel.module.scss';

export interface IDestination {
    Code: ISitecoreField<string>;
    HotelTheme: ISitecoreCompositeField<IHotelThemeFields>;
    HotelThemeType: ISitecoreCompositeField<IHotelThemeTypeFields>[];
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    ExcludedDestinations?: IExcludedDestinations[];
}

export interface IDestinationWithPrice extends ISitecoreChildren<IDestination>, ITouristTax {
    currency?: CurrencyCode;
    duration?: number;
    isPriceValid?: boolean;
    pricePP?: number;
}

export interface IPromoBlocksFields<T = Record<string, unknown>> {
    items: ISitecoreChildren<IDestination>[];
    datasourceItem?: T;
}

export type TMasonryCarouselProps = ISitecoreComponent<IPromoBlocksFields>;

export interface IMasonryTemplateProps {
    destinationsAvailability: Nullable<IDestinationAvailability>;
    items: IDestinationWithPrice[];
    className?: string;
    isNumberOfNightsLabel?: boolean;
}

type TTemplateType = typeof OneRowTemplate | typeof TwoRowsTemplate | typeof TwoColumnsTemplate;

const templateByLength: Record<number, TTemplateType> = {
    1: OneRowTemplate,
    2: OneRowTemplate,
    3: OneRowTemplate,
    4: TwoRowsTemplate,
    6: TwoRowsTemplate,
    5: TwoColumnsTemplate,
    7: TwoColumnsTemplate,
};

const MAX_ITEMS_PER_SLIDE = 7;

const MasonryCarousel: FC<TMasonryCarouselProps> = ({ fields }) => {
    const isMoreThenMobileViewport = useMoreThenMobileViewport();
    const {
        getLivePrice,
        getPhrase,
        isMasonryCarouselLivePriceEnabled,
        isLivePriceEnabledForDestination,
        destinationCode,
        isDestinationUnavailableBannerEnabled,
        getDestinationsAvailability,
        isTouristTaxEnabled,
    } = useStore((stores: TStores) => ({
        getLivePrice: stores.hotelsStore.getLivePrice,
        getPhrase: stores.layoutStore.getPhrase,
        isMasonryCarouselLivePriceEnabled: stores.layoutStore.isMasonryCarouselLivePriceEnabled,
        isLivePriceEnabledForDestination: stores.layoutStore.isLivePriceEnabledForDestination,
        destinationCode: stores.layoutStore.destinationCode,
        isDestinationUnavailableBannerEnabled: stores.layoutStore.isDestinationUnavailableBannerEnabled,
        getDestinationsAvailability: stores.hotelsStore.getDestinationsAvailability,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));
    const [prices, setPrices] = useState<ILivePrice[]>([]);
    const [availability, setAvailability] = useState<Nullable<IDestinationAvailability>>(null);
    const isMounted = useIsMounted();

    useEffect(() => {
        loadPrices();
        loadDestinationsAvailability();
    }, [destinationCode]);

    const loadPrices = async (): Promise<void> => {
        if (!isMasonryCarouselLivePriceEnabled) {
            return;
        }

        const livePrices = await getLivePrice(destinationsForLoadingLivePrices);
        setPrices(livePrices);
    };

    const loadDestinationsAvailability = async (): Promise<void> => {
        const destinationCodes = fields?.items?.map(item => item.fields?.Code?.value).filter(Boolean);

        if (!isDestinationUnavailableBannerEnabled || !destinationCodes?.length) {
            return;
        }

        const availability = await getDestinationsAvailability(destinationCodes.join(','));
        setAvailability(availability);
    };

    const destinationsForLoadingLivePrices = useMemo(
        () =>
            isLivePriceEnabledForDestination(destinationCode)
                ? (fields?.items || [])
                      .map(item => item.fields.Code.value)
                      .filter(dest => isLivePriceEnabledForDestination(dest))
                : [],
        [fields, destinationCode, isLivePriceEnabledForDestination],
    );

    const destinationsWithPrices: IDestinationWithPrice[] | ISitecoreChildren<IDestination>[] = useMemo(() => {
        const items = fields?.items || [];

        return items.map(item => {
            const livePrice = getDestinationLivePriceByCode(item.fields.Code.value, prices);

            return {
                ...item,
                pricePP: livePrice?.pricePP || 0,
                currency: livePrice?.currency,
                touristTaxPP: livePrice?.touristTaxPP || 0,
                priceExcludingTouristTax: livePrice?.priceExcludingTouristTax || 0,
                pricePPExcludingTouristTax: livePrice?.pricePPExcludingTouristTax || 0,
                touristTax: livePrice?.touristTax || 0,
                isPriceValid: !!livePrice?.pricePP,
            };
        });
    }, [fields, prices]);

    const isTouristTaxTooltipDisplayed = useMemo(
        () => destinationsWithPrices.some(dest => 'isPriceValid' in dest && dest.isPriceValid),
        [destinationsWithPrices],
    );

    const groupedImages = useMemo(() => {
        const result: ISitecoreChildren<IDestination>[][] = [];
        const items = [...destinationsWithPrices];

        while (items.length >= MAX_ITEMS_PER_SLIDE) {
            result.push(items.splice(0, MAX_ITEMS_PER_SLIDE));
        }
        items.length && result.push(items);

        return result;
    }, [destinationsWithPrices]);

    const slidesItems = useMemo(() => {
        if (isMoreThenMobileViewport || !isMounted) {
            return groupedImages;
        }

        return destinationsWithPrices;
    }, [isMoreThenMobileViewport, isMounted, groupedImages, destinationsWithPrices]);

    const slideTemplate = (group: IDestinationWithPrice[]): Nullable<JSX.Element> => {
        const Template = group?.length ? templateByLength[group.length] : null;

        if (!Template) return null;

        const isOneRow = Template === OneRowTemplate;
        const className = isOneRow && groupedImages.length > 1 ? 'large-row-template' : '';

        return <Template items={group} destinationsAvailability={availability} className={className} />;
    };

    const renderSlideItem = (item: IDestinationWithPrice | IDestinationWithPrice[]): Nullable<JSX.Element> => {
        // Render <MasonryItem> for single item
        if ('fields' in item) {
            return (
                <MasonryItem
                    item={item}
                    isUnavailable={availability ? !availability[item.fields?.Code?.value] : false}
                />
            );
        }

        // Render MasonryTemplate for item as array
        return slideTemplate(item);
    };

    if (!fields?.items?.length) {
        return null;
    }

    return (
        <div className='masonry-carousel'>
            <ImageGallery
                items={slidesItems}
                renderItem={renderSlideItem}
                showThumbnails={false}
                showFullscreenButton={false}
                showPlayButton={false}
                showNav={slidesItems.length > 1}
                showBullets={!isMoreThenMobileViewport && slidesItems.length > 1}
                renderLeftNav={(onClick: () => void): JSX.Element => <SliderNavButton isLeftNav onClick={onClick} />}
                renderRightNav={(onClick: () => void): JSX.Element => <SliderNavButton onClick={onClick} />}
                availability={availability}
            />
            {isTouristTaxEnabled && isMasonryCarouselLivePriceEnabled && isTouristTaxTooltipDisplayed && (
                <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                    <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                </TouristTaxGenericTooltip>
            )}
        </div>
    );
};

export default observer(MasonryCarousel);
