import * as React from 'react';
import { FC, useEffect, useMemo, useRef } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { envAll } from 'code/env';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { logger } from 'frontend/services/logging';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import {
    CAROUSEL_DESKTOP_MAX_BREAKPOINT,
    getSlidesToShow,
    responsive,
    responsiveCarouselSlim,
    slimCarouselMinItemsNumberToShow,
} from 'frontend/utils/getSlidersToShow';
import { getDestinationLivePriceByAccomCode } from 'frontend/utils/livePrice.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { ILuggageInformationFields } from 'models/data/IRecommendedHotels';
import { ISlidesOptions } from 'models/data/ISlidesOptions';
import { RecommenderMedium } from 'models/enum/tracking/RecommenderMedium';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import CarouselOfferCard from 'frontend/components/renderings/SearchResults/components/CarouselOfferCard';
import { CarouselButton } from 'frontend/components/renderings/SearchResults/components/OffersCarouselButton';
import ShortlistManaging from 'frontend/components/renderings/SearchResults/components/ShortlistManaging';

import styles from './RecommendedHotelsCarousel.module.scss';

export const responsiveCarousel3Items: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 }, items: 3 },
    tablet: { breakpoint: { max: 992, min: 768 }, items: 2 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export interface IRecommendedHotelsCarouselProps {
    fallbackImage: string;
    numberOfShowItem: number;
    offers: Nullable<IOffer[]>;
    onSelectedOffer: (offer: IOffer, url: string) => void;
    recommendedType: string;
    title: string;
    className?: string;
    description?: Nullable<string>;
    displaySponsoredLabel?: boolean;
    fields?: ILuggageInformationFields;
    isLeftAligned?: boolean;
    isSlimCardsDesign?: boolean;
    livePrices?: ILivePrice[];
    openLinksInNewTab?: boolean;
    withoutPadding?: boolean;
}

export const RecommendedHotelsCarousel: FC<IRecommendedHotelsCarouselProps> = ({
    fallbackImage,
    numberOfShowItem,
    offers,
    onSelectedOffer,
    recommendedType,
    title,
    className,
    description,
    fields,
    isLeftAligned,
    isSlimCardsDesign,
    livePrices,
    openLinksInNewTab,
    withoutPadding,
    displaySponsoredLabel,
}) => {
    const carousel = useRef<TCarouselRef | null>(null);
    const isFirstRender = useRef(true);
    const previousSlideRef = useRef(0);
    const hasTrackedInitialLoad = useRef(false);

    const {
        destination,
        isScreenExtraLarge,
        isScreenLarge,
        isScreenMedium,
        isPromoPage,
        isSearchResultsPage,
        trackRecommenderLoaded,
        trackRecommenderPagination,
        trackRecommenderInteraction,
        trackRecommenderHotelClick,
        isPostTravelPage,
        isCancelledBookingPage,
    } = useStore((stores: TStores) => ({
        destination: stores.layoutStore.displayName,
        isScreenExtraLarge: stores.appStore.isScreenExtraLarge,
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        isScreenLarge: stores.appStore.isScreenLarge,
        isScreenMedium: stores.appStore.isScreenMedium,
        isPromoPage: stores.layoutStore.isPromoPage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        trackRecommenderLoaded: stores.trackingStore.trackRecommenderLoaded,
        trackRecommenderPagination: stores.trackingStore.trackRecommenderPagination,
        trackRecommenderInteraction: stores.trackingStore.trackRecommenderInteraction,
        trackRecommenderHotelClick: stores.trackingStore.trackRecommenderHotelClick,
        isPostTravelPage: isHolidayStore(stores) && stores.viewBookingStore.isPostTravelPage,
        isCancelledBookingPage: isHolidayStore(stores) && stores.layoutStore.isCancelledBookingPage,
    }));

    const offersToShow = (offers || []).slice(0, numberOfShowItem);
    const offersElements = offersToShow.map((offer: IOffer, i: number) => (
        <CarouselOfferCard
            key={`${offer.id}_${i}`}
            offer={offer}
            offerIndex={i}
            fallbackImage={fallbackImage || ''}
            onSelect={(offer, url): void => onSelectOffer(offer, url, i)}
            onImageSliderArrowClick={(): void => onImageSliderArrowClick(offer, i)}
            recommendedType={recommendedType}
            livePrice={getDestinationLivePriceByAccomCode(offer.accom?.code, livePrices) || undefined}
            fields={fields}
            openLinkInNewTab={openLinksInNewTab}
            displaySponsoredLabel={displaySponsoredLabel}
        />
    ));
    const responsiveConfig = useMemo(() => {
        if (isPostTravelPage || isCancelledBookingPage) {
            return responsiveCarousel3Items;
        }

        if (isPromoPage || isSearchResultsPage) {
            return responsiveCarouselSlim;
        }

        return responsive;
    }, [isPostTravelPage, isCancelledBookingPage, isPromoPage, isSearchResultsPage]);

    const getSlidesOptions = (): ISlidesOptions => {
        const currentSlide = carousel?.current?.state.currentSlide ?? 0;
        const slidesToShow = getSlidesToShow(
            responsiveConfig,
            isScreenExtraLarge,
            isScreenLarge,
            isScreenMedium,
            carousel?.current?.state.slidesToShow,
        );

        return {
            currentSlide: currentSlide,
            previousSlide: previousSlideRef.current,
            slidesToShow: Math.min(slidesToShow, offersToShow.length),
            slidesToSlide: 1,

            // use offers length because this.carousel.state.totalItems returns wrong number
            totalItems: offers?.length ?? 0,
        };
    };

    useEffect(() => {
        if (offers && offers.length > 0) {
            const slidesOptions = getSlidesOptions();

            if (envAll.ENABLE_BD4_LOGGING) {
                if (isFirstRender.current) {
                    logger.info(`RecommendedHotelsCarousel call trackRecommenderLoaded`);
                    isFirstRender.current = false;
                } else {
                    logger.info(`RecommendedHotelsCarousel componentDidUpdate`);
                }

                logger.info(`Offers: ${offers.length}`);
                logger.info(`SlidesOptions: ${JSON.stringify(slidesOptions)}`);
            }

            trackRecommenderLoaded(offers, slidesOptions);
            hasTrackedInitialLoad.current = true;
        } else {
            envAll.ENABLE_BD4_LOGGING &&
                logger.info(`RecommendedHotelsCarousel don't get offers: ${JSON.stringify(offers)}`);
        }
    }, [offers]);

    const haveLeftSideFiltersOnThePage = isPromoPage || isSearchResultsPage;

    const titleText = Tokenizer.replaceToken(title, Tokens.DestinationName, destination);

    const isCarousel = offersToShow.length > getSlidesOptions().slidesToShow;

    const onSelectOffer = (offer: IOffer, url: string, index: number): void => {
        onSelectedOffer(offer, url);
        trackRecommenderHotelClick(offer, index, getSlidesOptions());
    };
    const onImageSliderArrowClick = (offer: IOffer, index: number): void => {
        trackRecommenderInteraction(RecommenderMedium.Image, offer, index, getSlidesOptions());
    };

    const onSlideChange = (): void => {
        const currentSlide = carousel?.current?.state.currentSlide ?? 0;

        if (hasTrackedInitialLoad.current && currentSlide !== previousSlideRef.current) {
            trackRecommenderPagination(offers!, getSlidesOptions());
        }

        previousSlideRef.current = currentSlide;
    };

    const renderCarousel = (): React.JSX.Element => {
        if (!isCarousel) {
            return (
                <div className='hotels-carousel__results-list' data-tid='results'>
                    {offersElements}
                </div>
            );
        }

        return (
            <CarouselWrapper
                ref={el => {
                    carousel.current = el;
                }}
                responsive={responsiveConfig}
                showDots
                arrows={false}
                containerClass='slider-container'
                customButtonGroup={
                    <CarouselButton
                        {...(this as any)}
                        minItemsNumberToShow={
                            haveLeftSideFiltersOnThePage ? slimCarouselMinItemsNumberToShow : undefined
                        }
                    />
                }
                afterChange={onSlideChange}
            >
                {offersElements}
            </CarouselWrapper>
        );
    };

    if (!offers?.length) {
        return null;
    }

    return (
        <div
            className={classNames('hotels-carousel-wrapper wrapper-component-container__inner', {
                'mb-4': !!withoutPadding,
            })}
        >
            <div
                className={classNames(
                    'hotels-carousel hotels-carousel--recommended',
                    {
                        'hotels-carousel--slim': !!isSlimCardsDesign,
                        'py-0': !!withoutPadding,
                        [styles.noTitle]: !titleText,
                    },
                    className,
                )}
                data-tid='recommended-carousel'
            >
                {titleText && (
                    <h2
                        className={classNames('hotels-carousel__title', isLeftAligned && styles.leftAlignedTitle)}
                        data-tid='title'
                    >
                        {titleText}
                    </h2>
                )}
                {description && <p className='hotels-carousel__description'>{description}</p>}
                <div
                    className={classNames(isCarousel ? 'hotels-carousel__results' : 'hotels-carousel__one-result', {
                        // enable padding only when carousel view (and dots are displayed)
                        'pb-0': !!withoutPadding && offersToShow.length <= getSlidesOptions().slidesToShow,
                    })}
                    data-tid='recommended-carousel-results'
                >
                    {renderCarousel()}
                </div>
            </div>
            <ShortlistManaging />
        </div>
    );
};

export default observer(RecommendedHotelsCarousel);
