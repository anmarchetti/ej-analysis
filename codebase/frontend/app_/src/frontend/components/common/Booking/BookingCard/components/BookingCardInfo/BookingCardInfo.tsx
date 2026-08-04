import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BookingCanceledStatusInfo from 'frontend/components/common/Booking/BookingCard/components/BookingCanceledStatusInfo/BookingCanceledStatusInfo';
import BookingPriceBox from 'frontend/components/common/Booking/BookingCard/components/BookingPriceBox/BookingPriceBox';
import RemainingBalanceReminder from 'frontend/components/common/Booking/RemainingBalanceReminder/RemainingBalanceReminder';
import Button from 'frontend/components/common/Button';

import { usePreparedBookingInfoData } from './BookingCardInfo.utils';

import styles from './BookingCardInfo.module.scss';

export interface IBookingCardInfoProps {
    booking: IBookingInfo;
    isUpcoming: boolean;
}

export const BookingCardInfo: FC<IBookingCardInfoProps> = ({ booking, isUpcoming }) => {
    const { isCheckInAvailable, userData, getPhrase, basePath, isPaymentReminderVisible, getSetting, showBooking } =
        useStore(({ userStore, layoutStore, bookingStore, viewBookingStore }: IHolidaysStores) => ({
            userData: userStore.userData,
            getPhrase: layoutStore.getPhrase,
            basePath: layoutStore.basePath,
            isPaymentReminderVisible: bookingStore.isPaymentReminderVisible,
            showBooking: viewBookingStore.showBooking,
            getSetting: layoutStore.getSetting,
            isCheckInAvailable: bookingStore.isCheckInAvailable,
        }));
    const { isCanceled, isCheckInButtonDisplayed, checkInLink } = usePreparedBookingInfoData(booking, getSetting);
    const isCheckInDisplayed = isUpcoming && isCheckInAvailable(booking) && isCheckInButtonDisplayed;
    const isRemainingBalanceBannerVisible = isPaymentReminderVisible(booking);

    return (
        <div className={styles.info}>
            {isCanceled && <BookingCanceledStatusInfo displayOnMobile={false} />}

            {isRemainingBalanceBannerVisible && <RemainingBalanceReminder booking={booking} />}

            {!isRemainingBalanceBannerVisible && <BookingPriceBox booking={booking} isUpcoming={isUpcoming} />}

            <div className={styles.buttonsWrapper}>
                {isCheckInDisplayed && (
                    <a
                        className={classNames('btn', styles.btn)}
                        href={checkInLink || ''}
                        rel='noopener noreferrer'
                        target='_blank'
                        data-tid='check-in-link'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsCheckIn)}
                    </a>
                )}

                {isRemainingBalanceBannerVisible && (
                    <Button
                        className={styles.btn}
                        data-tid='pay-remaining-balance-btn'
                        onClick={() => goPayRemainingBalance(booking, userData, basePath)}
                    >
                        {getPhrase(SitecoreDictionary.BookingPaymentButtonsPayBalance)}
                    </Button>
                )}

                <Button className={styles.btn} isOutlined onClick={() => showBooking(booking)} dataTid='view-booking'>
                    {getPhrase(SitecoreDictionary.ViewBookingsButtonsViewBooking)}
                </Button>
            </div>
        </div>
    );
};

export default observer(BookingCardInfo);
