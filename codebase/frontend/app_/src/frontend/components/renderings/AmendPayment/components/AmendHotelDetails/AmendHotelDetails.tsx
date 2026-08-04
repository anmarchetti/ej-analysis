import { FunctionComponent } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAccommodationGuestsCount } from 'frontend/utils/accommodation.utils';
import DatesDetails from 'frontend/components/common/AmendHotelStickyHeader/components/DatesDetails/DatesDetails';
import LuggageDetails from 'frontend/components/common/AmendHotelStickyHeader/components/LuggageDetails/LuggageDetails';
import HolidaySummaryPlainOptions from 'frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions';
import HolidaySummaryRoomAndBoard from 'frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard';
import HolidaySummaryTransfer from 'frontend/components/common/HolidaySummaryTransfer/HolidaySummaryTransfer';
import { getHotelChangeInfo } from 'frontend/components/renderings/AmendHotel/AmendHotel.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import styles from './AmendHotelDetails.module.scss';

export interface IAmendHotelDetailsProps {
    fields: IPaymentPageFields;
}

const AmendHotelDetails: FunctionComponent<IAmendHotelDetailsProps> = ({ fields }) => {
    const { booking, newlySelectedHotelOffer } = useStore((stores: IHolidaysStores) => ({
        newlySelectedHotelOffer: stores.amendHotelStore.newlySelectedHotelOffer,
        booking: stores.viewBookingStore.booking,
    }));

    if (!booking || !newlySelectedHotelOffer) {
        return null;
    }

    const { startDate, endDate, transfer, hotel } = getHotelChangeInfo(booking, newlySelectedHotelOffer);

    const hotelMeta = {
        resort: {
            name: hotel?.resort.name || '',
            region: hotel?.location.name || '',
        },
        name: hotel?.name ?? '',
    };

    return (
        <div className={styles.container} data-tid='amend-payment-hotel-details'>
            <div className={styles.row}>
                <HolidaySummaryRoomAndBoard
                    accom={booking.package.accom}
                    units={newlySelectedHotelOffer.accom.unit}
                    hotel={hotelMeta}
                    dataTid='amend-payment-hotel-room-and-board'
                >
                    <DatesDetails
                        startDate={startDate}
                        endDate={endDate}
                        className={styles.datesDetails}
                        dataTid='amend-payment-hotel-dates'
                    />
                </HolidaySummaryRoomAndBoard>
            </div>
            <div className={classNames(styles.row, styles.extrasRow)}>
                <LuggageDetails
                    dataTid='amend-payment-hotel-luggage'
                    booking={booking}
                    titleField={fields.LuggageTitle}
                    className={styles.luggageDetails}
                />
                <HolidaySummaryTransfer transfer={transfer} dataTid='amend-payment-hotel-transfer' />
            </div>
            <div className={styles.row}>
                <HolidaySummaryPlainOptions
                    guestsCount={getAccommodationGuestsCount(booking.package.accom.rooms)}
                    dataTid='amend-payment-hotel-guests'
                />
            </div>
        </div>
    );
};

export default AmendHotelDetails;
