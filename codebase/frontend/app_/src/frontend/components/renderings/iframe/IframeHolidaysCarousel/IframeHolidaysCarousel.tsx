import React, { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { ILuggageInformationFields } from 'models/data/IRecommendedHotels';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import IconChevronLeft from 'frontend/components/icons/ChevronLeft';
import IconChevronRight from 'frontend/components/icons/ChevronRight';
import SvgAtol from 'frontend/components/icons-new/Atol';

import HolidayCard from './components/Cards/HolidayCard/HolidayCard';
import ViewAllCard from './components/Cards/ViewAllCard/ViewAllCard';
import ShowMoreLink from './components/ShowMoreLink/ShowMoreLink';

import styles from './IframeHolidaysCarousel.module.scss';
const MAX_VISIBLE_ITEMS = 5;

const responsive: ResponsiveType = {
    large: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1100 }, items: 3, partialVisibilityGutter: 15 },
    medium: { breakpoint: { max: 1100, min: 840 }, items: 3, partialVisibilityGutter: 10 },
    // iframe width is 630px on desktop in easyjet.com
    small: { breakpoint: { max: 840, min: 577 }, items: 2, partialVisibilityGutter: 39 },
    extraSmall: { breakpoint: { max: 576, min: 0 }, items: 1 },
};

export const IframeHolidaysCarousel: FC<ISitecoreComponent<ILuggageInformationFields>> = () => {
    const {
        offers,
        totalGuestQuantity,
        childrenQuantity,
        basePath,
        isATOLProtectionEnabled,
        getPhrase,
        buildSearchQueryWithParams,
        getSetting,
    } = useStore((stores: IHolidaysStores) => ({
        offers: stores.hotelsStore.offers,
        totalGuestQuantity: stores.queryParamStore.totalGuestQuantity,
        childrenQuantity: stores.queryParamStore.childrenQuantity,
        basePath: stores.layoutStore.basePath,
        isATOLProtectionEnabled: stores.layoutStore.isATOLProtectionEnabled,
        getPhrase: stores.layoutStore.getPhrase,
        buildSearchQueryWithParams: stores.queryParamStore.buildSearchQueryWithParams,
        getSetting: stores.layoutStore.getSetting,
    }));

    const getShowMoreLink = (orderDirection: OrderDirection, orderBy: OrderBy): string => {
        const query = {
            [QueryParamName.OrderDirection]: orderDirection,
            [QueryParamName.OrderBy]: orderBy,
            [QueryParamName.IsReferer]: 1,
        };
        const link =
            childrenQuantity || totalGuestQuantity === 1
                ? `${SitePath.Home}${buildSearchQueryWithParams(true, {
                      ...query,
                      [QueryParamName.OpenSearchPodWhoField]: 1,
                  })}`
                : `${SitePath.Search}${buildSearchQueryWithParams(true, query)}`;

        return basePath + link;
    };

    const isScreenExtraSmall = useXSMobileViewport();

    if (!offers.length) {
        return null;
    }

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const offersToShow = offers.slice(0, MAX_VISIBLE_ITEMS);
    const shouldShowPrice = !childrenQuantity;

    return (
        <div className={styles.container} data-tid='carousel-container'>
            <CarouselWrapper
                responsive={responsive}
                showDots={isScreenExtraSmall}
                arrows={!isScreenExtraSmall}
                partialVisible
                customLeftArrow={
                    <button className={classNames(styles.carouselArrow, 'left')} data-tid='carousel-arrow-left'>
                        <IconChevronLeft />
                    </button>
                }
                customRightArrow={
                    <button className={classNames(styles.carouselArrow, 'right')} data-tid='carousel-arrow-right'>
                        <IconChevronRight />
                    </button>
                }
                containerClass={styles.carousel}
            >
                {offersToShow.map(offer => (
                    <HolidayCard
                        offer={offer}
                        key={offer.id}
                        fallbackImage={fallbackImage}
                        shouldShowPrice={shouldShowPrice}
                    />
                ))}
                <ViewAllCard href={getShowMoreLink(OrderDirection.Default, OrderBy.Recommended)} />
            </CarouselWrapper>

            <div className={styles.footerInfo}>
                <ShowMoreLink
                    href={getShowMoreLink(OrderDirection.Asc, OrderBy.Price)}
                    shouldShowPrice={shouldShowPrice}
                    className={styles.showMoreLink}
                />

                {isATOLProtectionEnabled && (
                    <p className={styles.atolText} data-tid='atol'>
                        <SvgAtol />
                        {getPhrase(SitecoreDictionary.IframePromotingHolidaysLabelsAtol)}
                    </p>
                )}
            </div>
        </div>
    );
};

export default observer(IframeHolidaysCarousel);
