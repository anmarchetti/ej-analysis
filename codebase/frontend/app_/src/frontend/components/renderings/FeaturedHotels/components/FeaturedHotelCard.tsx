import React, { FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { purifyUrl } from 'frontend/utils/url.utils';
import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import { MediaSize } from 'models/data/MediaSizeParams';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import Link from 'frontend/components/common/Link';
import LuxuryBadge from 'frontend/components/common/LuxuryBadge/LuxuryBadge';

import FeaturedHotelCardInfo from './FeaturedHotelCardInfo';

import styles from './FeaturedHotelCard.module.scss';

export interface IFeaturedHotelCardProps {
    fallbackImage: string;
    hotel: IFeaturedHotelsWithPrice;
    onClick: (item: IFeaturedHotelsWithPrice, destination: string) => void;
    displayNumberOfNights?: boolean;
}

export const FeaturedHotelCard: FC<IFeaturedHotelCardProps> = ({
    hotel,
    fallbackImage,
    onClick,
    displayNumberOfNights,
}) => {
    const { isLivePriceEnabled, searchResultsUrl, buildSearchQueryByLivePrice, setSearchValuesByQueryString } =
        useStore((stores: TStores) => ({
            isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
            searchResultsUrl: stores.routerStore.searchResultsUrl,
            buildSearchQueryByLivePrice: stores.queryParamStore.buildSearchQueryByLivePrice,
            setSearchValuesByQueryString: stores.bookingStore.setSearchValuesByQueryString,
        }));
    const [infoBlockHeight, setInfoBlockHeight] = useState<number>();

    // EJH-17603 White block within each card that has the same height
    useEffect(() => {
        const recalculateHeight = () => {
            const elements = document.querySelectorAll('.featured-hotel-card__info');
            const heights = Array.from(elements).map((el: HTMLElement) => el.clientHeight);
            const maxHeight = Math.max(...heights);
            setInfoBlockHeight(maxHeight);
        };

        recalculateHeight();

        window.addEventListener('resize', recalculateHeight);
        window.addEventListener('orientationchange', recalculateHeight);

        return () => {
            window.removeEventListener('resize', recalculateHeight);
            window.removeEventListener('orientationchange', recalculateHeight);
        };
    }, [hotel]);

    const hasLivePrice = isLivePriceEnabled && hotel?.livePrice && hotel.livePrice.pricePP > 0;
    const hotelLinkQuery = useMemo(() => {
        if (hasLivePrice) {
            return buildSearchQueryByLivePrice(hotel.livePrice!, true);
        }

        return '';
    }, [hasLivePrice, hotel]);

    const hotelLink = useMemo(() => {
        if (hasLivePrice) {
            return searchResultsUrl(hotelLinkQuery);
        }

        return (hotel && purifyUrl(hotel.Url)) || '';
    }, [hasLivePrice, hotel, hotelLinkQuery]);

    if (!hotel) {
        return null;
    }

    const dateFromSitecore = formatDateL10n(hotel?.BookFrom, DATE_FORMATS.dateWithAbbrMonthName);
    const dateBadgeText = dateFromSitecore.length ? dateFromSitecore : hotel.BookFromText;

    const onHotelLinkClick = () => {
        if (hasLivePrice) {
            setSearchValuesByQueryString(hotelLinkQuery);
        }

        onClick(hotel, hotelLink);
    };

    const isLuxury = containsLuxuryPromoCode(hotel.livePrice?.promoCollections);

    return (
        <div className='featured-hotel-card' data-tid='featured-hotel-card'>
            <Link href={hotelLink} legacyBehavior>
                <a onClick={onHotelLinkClick} data-tid='btn' className='featured-hotel-card__link'>
                    <div className='featured-hotel-card__bg'>
                        {isLuxury && <LuxuryBadge wrapperClassName={styles.luxuryBadgeWrapper} />}

                        <JSSImageNext
                            field={hotel?.Image}
                            fallbackImage={fallbackImage}
                            fill
                            mediaSize={{
                                desktop: MediaSize.Medium,
                            }}
                        />
                        {!!dateBadgeText && (
                            <div className='featured-hotel-card__date-badge-wrapper'>
                                <div data-tid='featured-hotel-card-badge' className='featured-hotel-card__date-badge'>
                                    {dateBadgeText}
                                </div>
                            </div>
                        )}
                    </div>
                    <FeaturedHotelCardInfo
                        hotel={hotel}
                        hasLivePrice={hasLivePrice}
                        infoBlockHeight={infoBlockHeight}
                        displayNumberOfNights={displayNumberOfNights}
                    />
                </a>
            </Link>
        </div>
    );
};

export default observer(FeaturedHotelCard);
