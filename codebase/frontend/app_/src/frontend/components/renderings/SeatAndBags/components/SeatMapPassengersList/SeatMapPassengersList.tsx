import React from 'react';

import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import styles from './SeatMapPassengersList.module.scss';

export interface ISeatMapPassengersListProps {
    seats: (IPassengerSeat | undefined)[];
}

export const SeatMapPassengersList = ({ seats }: ISeatMapPassengersListProps) => {
    const hasSeatsNumber = seats?.some(seat => seat?.seatNumber);

    if (hasSeatsNumber) {
        return (
            <div className={styles.seatsContainer} data-tid='seats-container'>
                {seats.map(seat => (
                    <span
                        key={seat?.seatNumber}
                        className={`seat-confirmation__seat-number seat-confirmation__seat-number--alt  seat-confirmation__seat-number--alt--margin seat-confirmation__seat-number--border-color-${getSeatBorderColor(
                            seat?.priceBand,
                        )}`}
                        data-tid='seat-number'
                    >
                        {seat?.seatNumber}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div data-tid='no-seat-text' className={styles.noSeat}>
            <RichTextDictionary tag='span' dictionaryKey={SitecoreDictionary.SeatMapLabelsNoSeatSelectedPlural} />
        </div>
    );
};

export default SeatMapPassengersList;
