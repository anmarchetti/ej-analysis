import React from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDaysDifference } from 'frontend/utils/date.utils';
import { getBookingDestination, getValidBalanceDueDate } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgBell from 'frontend/components/icons-new/Bell';

import {
    getRemainingBalanceButtonDescription,
    getRemainingBalanceDescription,
    getRemainingBalanceTitle,
} from './RemainingBalanceReminder.utils';

import styles from './RemainingBalanceReminder.module.scss';

interface IBookingToolbarProps {
    booking: IBookingInfo;
}

const RemainingBalanceReminder = ({ booking }: IBookingToolbarProps) => {
    const { getPhrase, daysBeforeDepartureToShowReminder, formatMoney } = useStore(
        ({ layoutStore, marketStore }: IHolidaysStores) => ({
            getPhrase: layoutStore.getPhrase,
            daysBeforeDepartureToShowReminder: layoutStore.daysBeforeDepartureToShowReminder,
            formatMoney: marketStore.formatMoney,
        }),
    );

    const { balanceDueDate, balanceDueAmount, currency } = booking?.paymentInfo || {};
    const validBalanceDueDate: string = getValidBalanceDueDate(
        balanceDueDate,
        booking.package.accom.startDate,
        daysBeforeDepartureToShowReminder,
    );
    const destination = getBookingDestination(booking);
    const remainingDays = getDaysDifference(new Date(validBalanceDueDate), new Date());
    const title = getRemainingBalanceTitle(remainingDays, getPhrase);
    const price = formatMoney(balanceDueAmount ?? 0, {
        currency,
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });
    const description = getRemainingBalanceDescription(
        remainingDays,
        validBalanceDueDate,
        getPhrase,
        getPhrase(SitecoreDictionary.BookingHeaderLabelsOutstanding),
        destination,
        price,
    );
    const btnDescription = getRemainingBalanceButtonDescription(remainingDays, validBalanceDueDate, getPhrase);

    return (
        <div className={styles.container} data-tid='remaining-balance-reminder'>
            <div className={styles.infoBlock}>
                <div className={styles.icon} data-tid='reminder-icon'>
                    <SvgBell />
                </div>
                <div>
                    <RichText field={{ value: title }} tag='div' className={styles.title} data-tid='reminder-title' />

                    <RichText
                        field={{ value: description }}
                        className={styles.description}
                        data-tid='reminder-price'
                        data-cs-mask
                    />
                </div>
            </div>

            <RichText className={styles.btnDescription} field={{ value: btnDescription }} data-tid='reminder-text' />
        </div>
    );
};

export default observer(RemainingBalanceReminder);
