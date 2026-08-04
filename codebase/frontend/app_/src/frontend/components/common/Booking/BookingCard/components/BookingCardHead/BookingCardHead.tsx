import React, { FC } from 'react';
import { inject } from 'mobx-react';

import { IHolidaysStores } from 'frontend/store/holidays';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ITheme, IThemeType } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import Link from 'frontend/components/common/Link';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import HolidayTheme from 'frontend/components/renderings/ViewBookings/components/HolidayTheme';

import { usePreparedBookingHeadData } from './BookingCardHead.utils';

import styles from './BookingCardHead.module.scss';

export interface IBookingHead {
    hotelName: string;
    hotelPath: string;
    hotelTheme: Nullable<ITheme>;
    hotelType: Nullable<IThemeType>;
    isTAInfoDisplayed: boolean;
    numberOfReviews: number;
    starRating: Nullable<number>;
    taRating: Nullable<number>;
    hotelLocation?: string;
}

export interface IBookingCardDetailsProps {
    booking: IBookingInfo;
    getPhrase: (phrase: SitecoreDictionary) => string;
    isEcoCertifiedEnabledOnBookingListPage: boolean;
    isPaymentReminderVisible: (booking: IBookingInfo) => boolean;
    isScreenExtraSmall: boolean;
}

export const BookingCardHead: FC<IBookingCardDetailsProps> = ({
    booking,
    isScreenExtraSmall,
    isEcoCertifiedEnabledOnBookingListPage,
    isPaymentReminderVisible,
    getPhrase,
}) => {
    const {
        hotelPath,
        hotelLang,
        hotelName,
        hotelType,
        hotelTheme,
        hotelLocation,
        starRating,
        isTAInfoDisplayed,
        taRating,
        numberOfReviews,
        isEcoCertifiedPillDisplayed,
        title,
        tooltip,
    } = usePreparedBookingHeadData(booking, isEcoCertifiedEnabledOnBookingListPage);

    const isPaymentReminderDisplayed = isPaymentReminderVisible(booking);

    return (
        <div className={styles.head}>
            <div className='hotel-card-head d-flex justify-content-between'>
                <div className='hotel-card-head-title-box hotel-card-head-title-box__theme-box'>
                    <div className='hotel-card-head-title-wrapper'>
                        <Link href={hotelPath} locale={hotelLang}>
                            <div className='hotel-card-head-title'>{hotelName}</div>
                        </Link>
                        {hotelType && !isScreenExtraSmall && (
                            <HolidayTheme holidayType={hotelType} holidayTheme={hotelTheme} withIcon />
                        )}
                    </div>
                    {hotelLocation && <div className='my-1 hotel-card-head-location'>{hotelLocation}</div>}
                    {hotelType && isScreenExtraSmall && (
                        <HolidayTheme holidayType={hotelType} holidayTheme={hotelTheme} withIcon />
                    )}
                    <div className={styles.details}>
                        <div className={styles.ratings}>
                            <div className={styles.ratingItem}>
                                <StarRating rating={starRating} />
                            </div>
                            {isTAInfoDisplayed && (
                                <div className={styles.ratingItem}>
                                    <TripadvisorInfo rating={taRating} reviews={numberOfReviews} />
                                </div>
                            )}
                            {isEcoCertifiedPillDisplayed && (
                                <div className={styles.ratingItem}>
                                    <EcoCertifiedPill title={title} tooltip={tooltip} />
                                </div>
                            )}
                        </div>
                        {!isPaymentReminderDisplayed && (
                            <div className='text-md-right my-2 my-md-0' data-tid='booking-reference'>
                                {getPhrase(SitecoreDictionary.ViewBookingsLabelsReferenceNumber)}{' '}
                                <span className={styles.referenceNumber}>{booking.bookingReference}</span>
                            </div>
                        )}
                    </div>
                    {isPaymentReminderDisplayed && (
                        <div className='mb-2 mb-md-0 mt-2' data-tid='booking-reference'>
                            {getPhrase(SitecoreDictionary.ViewBookingsLabelsReferenceNumber)}{' '}
                            <span className={styles.referenceNumber}>{booking.bookingReference}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default inject((stores: IHolidaysStores) => ({
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    isEcoCertifiedEnabledOnBookingListPage: stores.layoutStore.isEcoCertifiedEnabledOnBookingListPage,
    getPhrase: stores.layoutStore.getPhrase,
    isPaymentReminderVisible: stores.bookingStore.isPaymentReminderVisible,
}))(BookingCardHead);
