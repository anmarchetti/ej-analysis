import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IBookingInfo, IPreBookingInfo } from 'models/data/IBookingInfo';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import styles from './HotelRating.module.scss';

export interface IHotelRating {
    booking: IBookingInfo | IPreBookingInfo;
}

const HotelRating: FunctionComponent<IHotelRating> = ({ booking }) => {
    const { isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage } = useStore(stores => ({
        isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage:
            stores.layoutStore.isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage,
    }));

    const { starRating, numberOfReviews, taRating } = getHotelMeta(booking);
    const { ecoFacility } = booking.hotel || {};
    const isRenderTA = !!taRating && !!numberOfReviews;
    const isRenderEcoTooltip =
        !!ecoFacility?.name && !!ecoFacility?.tooltip && isEcoCertifiedEnabledOnHotelSummaryInViewBookingPage;

    return (
        <div className={classNames(styles.container, 'view-booking-hotel__rating')} data-tid='hotel-rating'>
            <StarRating rating={starRating} />
            {isRenderTA && <TripadvisorInfo rating={taRating} reviews={numberOfReviews} />}
            {isRenderEcoTooltip && <EcoCertifiedPill title={ecoFacility.name} tooltip={ecoFacility.tooltip} />}
        </div>
    );
};

export default observer(HotelRating);
