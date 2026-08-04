import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';

const CancelledBookingBanner = () => {
    const { getPhrase, booking, isLoggedIn, isBookingCanceled, toggleLoginPopup, setRedirectUrl, isTradePortal } =
        useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            booking: stores.viewBookingStore.booking,
            isLoggedIn: stores.userStore.isLoggedIn,
            isBookingCanceled: stores.viewBookingStore.isBookingCanceled,
            toggleLoginPopup: isHolidayStore(stores) ? stores.userStore.toggleLoginPopup : () => {},
            setRedirectUrl: stores.userStore.setRedirectUrl,
            isTradePortal: stores.layoutStore.isTradePortal,
        }));

    if (!booking || !isBookingCanceled) {
        return null;
    }

    const getMessage = () => {
        const destination = booking.hotel ? getHotelLocation(booking.hotel) : '';
        let dictionary;

        if (isLoggedIn) {
            dictionary = booking.wasRefunded
                ? SitecoreDictionary.CancelledBookingMessagesRefund
                : SitecoreDictionary.CancelledBookingMessagesCredit;
        } else {
            dictionary = booking.wasRefunded
                ? SitecoreDictionary.CancelledBookingMessagesRefundLogin
                : SitecoreDictionary.CancelledBookingMessagesCreditLogin;
        }

        return Tokenizer.replaceToken(getPhrase(dictionary), Tokens.Destination, destination);
    };

    const onLogin = (e?: React.MouseEvent) => {
        e?.preventDefault();
        setRedirectUrl(SitePath.ViewBookings);
        toggleLoginPopup();
    };

    const renderButton = () => {
        if (isLoggedIn || isTradePortal) {
            return (
                <Link href={!isTradePortal ? SitePath.ViewBookings : SitePath.TradePortalFindBooking} legacyBehavior>
                    <a className='btn btn--outlined' data-tid='back-to-bookings-btn'>
                        {getPhrase(SitecoreDictionary.CancelledBookingButtonsViewBookings)}
                    </a>
                </Link>
            );
        }

        return (
            <Button isOutlined onClick={onLogin} data-tid='login-btn'>
                {getPhrase(SitecoreDictionary.CancelledBookingButtonsLogin)}
            </Button>
        );
    };

    return (
        <div className='cancelled-banner'>
            <div className='wrapper-component-container__inner'>
                <div className='cancelled-banner__message'>
                    <h2 className='cancelled-banner__title'>
                        {getPhrase(SitecoreDictionary.CancelledBookingTitlesHolidayCancelled)}
                    </h2>
                    <p>{getMessage()}</p>
                </div>
                <div className='cancelled-banner__cta'>{renderButton()}</div>
            </div>
        </div>
    );
};

export default observer(CancelledBookingBanner);
