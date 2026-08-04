import React from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';

interface IFeedbackSuccessPopupProps {
    onClose: () => void;
}

const titleId = 'feedback-success-title';
const confirmButtonId = 'feedback-success-confirm';

export const FeedbackSuccessPopup = ({ onClose }: IFeedbackSuccessPopupProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <Popup
            containerClass='feedback-popup feedback-popup--success no-print'
            isToastPopup
            showCloseButton
            disableReturnFocusOnUnmount
            onClose={onClose}
            initialFocus={`#${confirmButtonId}`}
            aria-labelledby={titleId}
        >
            <h2 className='feedback-popup__title' id={titleId}>
                {getPhrase(SitecoreDictionary.FeedbackPopupLabelsSuccessMessageTitle)}
            </h2>

            <p className='feedback-popup__subtitle'>
                {getPhrase(SitecoreDictionary.FeedbackPopupLabelsSuccessMessageDescription)}
            </p>

            <Button id={confirmButtonId} onClick={onClose}>
                {getPhrase(SitecoreDictionary.FeedbackPopupButtonsBackToBooking)}
            </Button>
        </Popup>
    );
};

export default FeedbackSuccessPopup;
