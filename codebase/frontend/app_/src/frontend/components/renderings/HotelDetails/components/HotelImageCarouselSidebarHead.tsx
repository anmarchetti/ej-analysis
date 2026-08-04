import React, { FC } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getHotelLocationHrefs } from 'frontend/utils/getHotelLocation';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import { RenderedHotelLocationLinks } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';
import ShortlistButton from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

import HotelRating from './HotelRating';
import TripadvisorInfo from './TripadvisorInfo';

import styles from './HotelImageCarouselSidebar.module.scss';

export interface IHotelImageCarouselSidebarHeadProps {
    hotelInfo: Nullable<IHotel>;
    offer: IOffer;
    rendering: any;
    reviewsAnchor: string;
}

const HotelImageCarouselSidebarHead: FC<IHotelImageCarouselSidebarHeadProps> = ({
    offer,
    rendering,
    hotelInfo,
    reviewsAnchor,
}) => {
    const { isShortlistEnabled, isEcoCertifiedEnabledOnHotelDetailsPage } = useStore(stores => ({
        isShortlistEnabled: !isTradeStore(stores) && stores.shortlistStore.isShortlistEnabled,
        isEcoCertifiedEnabledOnHotelDetailsPage: stores.layoutStore.isEcoCertifiedEnabledOnHotelDetailsPage,
    }));

    const { name, starRating, rating, numberOfReviews, ecoFacility } = hotelInfo || {};

    const title = name ? typeof name === 'string' ? name : <Text field={name} /> : '';

    const subTitle = hotelInfo ? (
        <RenderedHotelLocationLinks
            hotelLocationLinks={getHotelLocationHrefs(hotelInfo)}
            separator={' '}
            itemClassName={'card-head__subtitle_link'}
        />
    ) : (
        ''
    );

    const ratingDisplay = starRating ? parseInt(starRating) : 0;

    return (
        <>
            <div className='card-head' data-tid='card-head'>
                <div className='card-head__content'>
                    <div>
                        <div className='card-head__subtitle'>
                            <div className='card-head__subtitle_text' data-tid='sub-title'>
                                {subTitle}
                            </div>
                        </div>

                        <h1 className='card-head__title' data-tid='title'>
                            {title}
                        </h1>
                    </div>

                    <div
                        data-tid='card-head-actions'
                        className={classNames('card-head__actions', {
                            [styles.cardHeadActionsLong]: isShortlistEnabled,
                        })}
                    >
                        {isShortlistEnabled && <ShortlistButton offer={offer} />}
                        <Placeholder name={PlaceholderNames.ShareHolidayButton} rendering={rendering} />
                    </div>
                </div>

                <div className='card-head__reviews'>
                    <HotelRating rating={ratingDisplay} />
                    {!!rating && !!numberOfReviews && (
                        <TripadvisorInfo rating={rating} reviews={numberOfReviews} reviewsAnchor={reviewsAnchor} />
                    )}
                </div>
            </div>
            {ecoFacility?.name && ecoFacility?.tooltip && isEcoCertifiedEnabledOnHotelDetailsPage && (
                <div className={styles.ecoPillWrapper}>
                    <EcoCertifiedPill
                        title={ecoFacility.name}
                        tooltip={ecoFacility.tooltip}
                        isNewPill
                        className={classNames(styles.ecoPillContent, styles.priority)}
                    />
                </div>
            )}
        </>
    );
};

export default observer(HotelImageCarouselSidebarHead);
