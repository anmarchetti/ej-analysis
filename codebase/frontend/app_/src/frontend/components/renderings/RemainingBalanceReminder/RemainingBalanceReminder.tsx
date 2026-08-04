import React, { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { BookingContext } from 'frontend/context/BookingContext';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDaysDifference } from 'frontend/utils/date.utils';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import { getValidBalanceDueDate } from 'frontend/utils/viewBooking.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import {
    getRemainingBalanceDescription,
    getRemainingBalanceTitle,
} from 'frontend/components/common/Booking/RemainingBalanceReminder/RemainingBalanceReminder.utils';
import Button from 'frontend/components/common/Button';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './RemainingBalanceReminder.module.scss';

interface IRemainingBalanceReminderFields {
    ButtonLabel: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
}

export type TRemainingBalanceReminderProps = ISitecoreComponent<IRemainingBalanceReminderFields>;

export const RemainingBalanceReminder: FC<TRemainingBalanceReminderProps> = ({ fields }) => {
    const { userData, getPhrase, basePath, isPaymentReminderVisible, daysBeforeDepartureToShowReminder } = useStore(
        ({ userStore, layoutStore, bookingStore }: IHolidaysStores) => ({
            userData: userStore.userData,
            getPhrase: layoutStore.getPhrase,
            basePath: layoutStore.basePath,
            isPaymentReminderVisible: bookingStore.isPaymentReminderVisible,
            daysBeforeDepartureToShowReminder: layoutStore.daysBeforeDepartureToShowReminder,
        }),
    );
    const { booking } = useContext(BookingContext);
    const isMobile = useMobileViewport();

    if (!booking || !fields) {
        return null;
    }

    const isPaymentReminderOnPage = isPaymentReminderVisible(booking);

    if (!isPaymentReminderOnPage) {
        return null;
    }

    const { ButtonLabel, Subtitle, Icon } = fields;
    const { balanceDueDate, balanceDueAmount, currency } = booking.paymentInfo;
    const validBalanceDueDate: string = getValidBalanceDueDate(
        balanceDueDate,
        booking.package.accom.startDate,
        daysBeforeDepartureToShowReminder,
    );
    const remainingDays = getDaysDifference(new Date(validBalanceDueDate), new Date());
    const title = getRemainingBalanceTitle(remainingDays, getPhrase);
    const description = getRemainingBalanceDescription(
        remainingDays,
        validBalanceDueDate,
        getPhrase,
        Subtitle?.value || '',
    );

    const buttonEl = (
        <Button
            data-tid='pay-remaining-balance-btn'
            onClick={() => goPayRemainingBalance(booking, userData, basePath)}
            className={styles.button}
        >
            <Text field={ButtonLabel} tag='span' />
        </Button>
    );
    const priceEl = (
        <div className={styles.price} data-tid='reminder-price'>
            <FormattedMoney
                amount={balanceDueAmount ?? 0}
                className={styles.decimalPart}
                options={{ currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }}
            />
        </div>
    );

    if (isMobile) {
        return (
            <div data-tid='remaining-balance-reminder' className={styles.balanceReminder}>
                <ExpandableItem
                    dataTid='expandable-reminder'
                    className={styles.expandable}
                    titleWrapperClassName={styles.titleWrapper}
                    title={title}
                    titleClassName={styles.title}
                    icon={<JSSImage field={Icon} className={styles.icon} data-tid='reminder-icon' />}
                >
                    <div className={styles.textContainer}>
                        <p className={styles.text} data-tid='reminder-text'>
                            {description}
                        </p>
                        {priceEl}
                    </div>
                </ExpandableItem>
                {buttonEl}
            </div>
        );
    }

    return (
        <div data-tid='remaining-balance-reminder' className={styles.balanceReminder}>
            <JSSImage field={Icon} className={styles.icon} data-tid='reminder-icon' />
            <div className={styles.mainContainer}>
                <div className={styles.textContainer}>
                    <h3 className={styles.title} data-tid='reminder-title'>
                        {title}
                    </h3>
                    <p className={styles.text} data-tid='reminder-text'>
                        {description}
                    </p>
                </div>
                <div className={styles.clickableContainer}>
                    {priceEl}
                    {buttonEl}
                </div>
            </div>
        </div>
    );
};

export default observer(RemainingBalanceReminder);
