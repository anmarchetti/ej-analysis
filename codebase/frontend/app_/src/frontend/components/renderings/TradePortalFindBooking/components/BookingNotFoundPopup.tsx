import React from 'react';

import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { ITradePortalFindBookingFields } from 'frontend/components/renderings/TradePortalFindBooking/TradePortalFindBooking';

export interface IBookingNotFoundPopupProps {
    fields: ITradePortalFindBookingFields;
    onClose: () => void;
}

export const BookingNotFoundPopup = ({ fields, onClose }: IBookingNotFoundPopupProps) => {
    if (!fields) {
        return null;
    }

    const { PopupTitle, PopupMessage, PopupButton } = fields;

    return (
        <Popup containerClass='find-booking-popup' onClose={onClose} title={PopupTitle?.value}>
            {!!PopupMessage?.value && <RichTextWithLinks field={PopupMessage} tag='p' className='subtitle' />}
            {!!PopupButton?.value && (
                <Button isMedium type='button' onClick={onClose}>
                    {PopupButton.value}
                </Button>
            )}
        </Popup>
    );
};

export default BookingNotFoundPopup;
