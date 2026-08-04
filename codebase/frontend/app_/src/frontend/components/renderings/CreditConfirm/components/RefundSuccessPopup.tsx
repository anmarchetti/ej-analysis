import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

export const RefundSuccessPopup = () => {
    const {
        getPhrase,
        booking,
        creditRefund,
        isPopupShown,
        toggleSuccessPopup,
        getBooking,
        fireViewBookingTrackingEvent,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.holidayCreditStore.booking,
        creditRefund: stores.holidayCreditStore.recentRefund,
        isPopupShown: stores.holidayCreditStore.isRefundSuccessPopupShown,
        toggleSuccessPopup: stores.holidayCreditStore.toggleCreditSuccessPopup,
        getBooking: stores.viewBookingStore.getBooking,
        fireViewBookingTrackingEvent: stores.trackingStore.fireViewBookingEvent,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const onClose = () => toggleSuccessPopup(false);

    const onViewBookingClick = () => {
        if (booking) {
            fireViewBookingTrackingEvent(
                ViewBookingTrackingEvents.CancelBookingModal,
                'View Cancelled Booking',
                booking,
            );
            const bookingPayload = getBookingPayload(booking);
            getBooking(bookingPayload);
        }

        onClose();
    };

    const handleOnCloseClick = () => {
        if (booking) {
            fireViewBookingTrackingEvent(ViewBookingTrackingEvents.CancelBookingModal, 'See Holiday Credit', booking);
        }

        onClose();
    };

    const renderFooterButtons = () => (
        <>
            <Button isMedium onClick={handleOnCloseClick}>
                {getPhrase(SitecoreDictionary.CreditConfirmSuccessPopupSeeCredit)}
            </Button>
            <Button isLink onClick={onViewBookingClick}>
                {getPhrase(SitecoreDictionary.CreditConfirmSuccessPopupViewBooking)}
            </Button>
        </>
    );

    const description = useMemo(() => {
        if (!booking || !creditRefund) return '';

        const wasCashRefunded = (creditRefund.cash || 0) > 0;
        const wasCreditRefunded = (creditRefund.credits || 0) > 0;
        const dictionary = wasCashRefunded
            ? wasCreditRefunded
                ? SitecoreDictionary.CreditConfirmSuccessPopupHolidayRefundedMessage
                : SitecoreDictionary.CreditConfirmSuccessPopupHolidayCashMessage
            : SitecoreDictionary.CreditConfirmSuccessPopupHolidayCreditedMessage;

        const currency = booking?.currency?.code;
        const creditAmount = formatMoney(creditRefund.credits || 0, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
        const cashAmount = formatMoney(creditRefund.cash, {
            currency,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });

        const tokens = {
            [Tokens.Destination]: booking.hotel?.name || '',
            [Tokens.Email]: booking.leadPassenger?.email || '',
            [Tokens.CreditAmount]: `<strong>${creditAmount}</strong>`,
            [Tokens.CashAmount]: `<strong>${cashAmount}</strong>`,
        };

        return Tokenizer.replaceTokens(getPhrase(dictionary), tokens);
    }, [booking, creditRefund]);

    useEffect(() => {
        if (booking) {
            fireViewBookingTrackingEvent(ViewBookingTrackingEvents.CancelBookingModal, 'Cancelled Booking', booking);
        }
    }, []);

    if (!isPopupShown) {
        return null;
    }

    return (
        <Popup
            containerClass='refund-success-popup'
            isContentCentered
            title={getPhrase(SitecoreDictionary.CreditConfirmSuccessPopupTitle)}
            footerContent={renderFooterButtons()}
            showCloseButton
            onClose={onClose}
            id='refund-success-popup'
        >
            <p dangerouslySetInnerHTML={{ __html: description }} />
        </Popup>
    );
};

export default observer(RefundSuccessPopup);
