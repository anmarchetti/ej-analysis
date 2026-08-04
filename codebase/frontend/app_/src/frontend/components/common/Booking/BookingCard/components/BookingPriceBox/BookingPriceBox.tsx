import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import PillsBlock from 'frontend/components/renderings/ViewBookings/components/PillsBlock';

import { usePreparedBookingPriceBoxData } from './BookingPriceBox.utils';

import styles from './BookingPriceBox.module.scss';

export interface IBookingPriceBoxProps {
    booking: IBookingInfo;
    isUpcoming: boolean;
}

export const BookingPriceBox: FC<IBookingPriceBoxProps> = ({ isUpcoming, booking }) => {
    const { getPhrase } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));
    const {
        isNullable,
        pills: pillsProps,
        isCancelWarningDisplayed,
    } = usePreparedBookingPriceBoxData(booking, isUpcoming);

    if (isNullable) {
        return null;
    }

    return (
        <PillsBlock {...pillsProps}>
            {isCancelWarningDisplayed && (
                <div className={styles.creditedMessage} data-tid='credit-message'>
                    <SvgWarningFilled />
                    {getPhrase(SitecoreDictionary.ViewBookingsLabelsCanBeRefunded)}
                </div>
            )}
        </PillsBlock>
    );
};

export default BookingPriceBox;
