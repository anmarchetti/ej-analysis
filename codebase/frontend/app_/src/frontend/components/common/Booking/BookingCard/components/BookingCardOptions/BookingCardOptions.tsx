import { FC } from 'react';
import classNames from 'classnames';

import { IBookingInfo } from 'models/data/IBookingInfo';
import BookingCanceledStatusInfo from 'frontend/components/common/Booking/BookingCard/components/BookingCanceledStatusInfo/BookingCanceledStatusInfo';
import OfferKeySellingPoints from 'frontend/components/renderings/SearchResults/components/OfferKeySellingPoints';

import { usePreparedBookingOptionsData } from './BookingCardOptions.utils';

import styles from './BookingCardOptions.module.scss';

export interface IBookingCardOptionsProps {
    booking: IBookingInfo;
}

export const BookingCardOptions: FC<IBookingCardOptionsProps> = ({ booking }) => {
    const { isCanceled, options: optionsProps } = usePreparedBookingOptionsData(booking);

    return (
        <div className={styles.options}>
            {isCanceled && <BookingCanceledStatusInfo displayOnMobile />}

            <div
                className={classNames('hotel-card-txt', {
                    'hotel-card-txt--canceled': isCanceled,
                })}
            >
                <OfferKeySellingPoints {...optionsProps} />
            </div>
        </div>
    );
};

export default BookingCardOptions;
