import React, { FC } from 'react';
import classNames from 'classnames';

import { IBookingInfo } from 'models/data/IBookingInfo';
import HolidayFlightDetails from 'frontend/components/common/HolidayFlightDetails';

import { usePreparedBookingDetailsData } from './BookingCardDetails.utils';

import styles from './BookingCardDetails.module.scss';

export interface IBookingCardDetailsProps {
    booking: IBookingInfo;
    className?: string;
}

export const BookingCardDetails: FC<IBookingCardDetailsProps> = ({ booking, className }) => {
    const { isCanceled, isFlightDetailsDisplayed, details: detailsProps } = usePreparedBookingDetailsData(booking);

    return (
        <div
            className={classNames(styles.details, className, 'hotel-card-txt', {
                'hotel-card-txt--canceled': isCanceled,
            })}
        >
            {isFlightDetailsDisplayed && <HolidayFlightDetails {...detailsProps} />}
        </div>
    );
};

export default BookingCardDetails;
