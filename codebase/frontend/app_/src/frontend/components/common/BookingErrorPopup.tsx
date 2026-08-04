import * as React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

const BookingErrorPopup = () => {
    const { isBookingFailed, setIsBookingFailed, getPhrase } = useStore(
        ({ bookingStore, layoutStore }: ITradePortalStores) => ({
            isBookingFailed: bookingStore.isBookingFailed,
            setIsBookingFailed: bookingStore.setIsBookingFailed,
            getPhrase: layoutStore.getPhrase,
        }),
    );

    if (!isBookingFailed) {
        return null;
    }

    const phoneNumber = getPhrase(SitecoreDictionary.BookingFailedPhoneNumber);

    const onClose = () => {
        setIsBookingFailed(false);
    };

    return (
        <Popup
            title={getPhrase(SitecoreDictionary.BookingFailedTitlesSomethingWentWrong)}
            containerClass='booking-failed'
            onClose={onClose}
            showCloseButton
        >
            <>
                <div className='booking-failed__text'>{getPhrase(SitecoreDictionary.BookingFailedLabelsTryAgain)}</div>
                <div className='booking-failed__divider'>
                    <span className='booking-failed__divider-text'>
                        {getPhrase(SitecoreDictionary.GlobalsLabelsOr)}
                    </span>
                </div>
                <RichTextDictionary
                    dictionaryKey={SitecoreDictionary.BookingFailedLabelsCallTradeSupportHTML}
                    tag='div'
                    className='booking-failed__text'
                />
                <div className='booking-failed__phone'>
                    <a className='booking-failed__phone-link' href={`tel:${phoneNumber}`}>
                        {phoneNumber}
                    </a>
                </div>
                <Button className='booking-failed__button' onClick={onClose}>
                    {getPhrase(SitecoreDictionary.BookingFailedButtonsTryAgain)}
                </Button>
            </>
        </Popup>
    );
};

export default observer(BookingErrorPopup);
