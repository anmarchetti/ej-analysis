import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenDesktopViewport, useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OfferCardHotelTitle from 'frontend/components/common/OfferCardHotelTitle/OfferCardHotelTitle';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import CompareCheckbox from 'frontend/components/renderings/SearchResults/components/OfferCardNew/components/CompareCheckbox/CompareCheckbox';
import OfferCardPills from 'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardPills/OfferCardPills';
import styles from 'frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew.module.scss';
import ShortlistButton from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

export interface IOfferCardHeaderProps {
    hotelLink: string;
    hotelLinkWithPrice: string;
    isOfferUnavailableInShortlist: boolean;
    isShortlistButton: boolean;
    offer: IOffer;
    onClickSelect: () => void;
    onClickViewHoliday: () => void;
    rendering: ISitecoreComponent['rendering'];
    routeDep: IRoute;
    isInAmendHotelFlow?: boolean;
}

const OfferCardHeader: FC<IOfferCardHeaderProps> = ({
    offer,
    hotelLink,
    hotelLinkWithPrice,
    onClickSelect,
    isOfferUnavailableInShortlist,
    isShortlistButton,
    rendering,
    routeDep,
    isInAmendHotelFlow,
    onClickViewHoliday,
}) => {
    const { isEcoCertifiedEnabledOnSearchPage } = useStore((stores: TStores) => ({
        isEcoCertifiedEnabledOnSearchPage: stores.layoutStore.isEcoCertifiedEnabledOnSearchPage,
    }));

    const hotel = offer.hotel;
    const starRating = hotel?.starRating ? parseInt(hotel.starRating.substring(-1, 1)) : null;
    const isEcoCertifiedPill = !!(
        hotel?.ecoFacility?.name &&
        hotel?.ecoFacility?.tooltip &&
        isEcoCertifiedEnabledOnSearchPage
    );
    const isTripAdvisorInfo = hotel && !!hotel.numberOfReviews && !!hotel.rating;
    const isTabletViewport = useMoreThenMobileViewport();
    const isDesktopViewport = useMoreThenDesktopViewport();
    const isEcoFacilityRendered = (isInAmendHotelFlow && isTabletViewport) || isDesktopViewport;

    return (
        <div className={classNames('hotel-card-head hotel-card-head-v2', styles.header)} data-tid='hotel-card-head'>
            <div className='hotel-card-head-title-box'>
                <div className={styles.hotelInfoHeader}>
                    <div>
                        <OfferCardHotelTitle
                            offer={offer}
                            hotelLink={hotelLink}
                            hotelLinkWithPrice={hotelLinkWithPrice}
                            onClick={onClickSelect}
                        />

                        {hotel && (
                            <div className='hotel-card-head-location hotel-card-head-location-v2'>
                                {getHotelLocation(hotel)}
                            </div>
                        )}
                    </div>
                    {isShortlistButton && !isDesktopViewport && <ShortlistButton offer={offer} />}
                </div>
                <div className={styles.hotelRatings} data-tid='offer-card-ratings'>
                    <StarRating
                        rating={starRating}
                        className={classNames({
                            [styles.dividerRating]: isTripAdvisorInfo,
                        })}
                    />
                    {isTripAdvisorInfo && <TripadvisorInfo rating={hotel.rating} reviews={hotel.numberOfReviews} />}
                </div>
            </div>

            {(isDesktopViewport || isEcoFacilityRendered) && (
                <div className={styles.headerActions} data-tid='hotel-card-head-actions'>
                    {isDesktopViewport && (
                        <CompareCheckbox
                            offer={{ ...offer, link: hotelLinkWithPrice, onClickViewHoliday, asLink: hotelLink }}
                        />
                    )}

                    {isEcoFacilityRendered && (
                        <OfferCardPills
                            isOfferUnavailableInShortlist={isOfferUnavailableInShortlist}
                            rendering={rendering}
                            offer={offer}
                            routeDep={routeDep}
                            isEcoCertifiedPill={isEcoCertifiedPill}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default observer(OfferCardHeader);
