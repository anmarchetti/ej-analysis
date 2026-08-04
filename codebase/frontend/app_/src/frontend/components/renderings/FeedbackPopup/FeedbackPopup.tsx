import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import PopupCloseButton from 'frontend/components/common/Popup/PopupCloseButton';

import FeedbackForm from './components/FeedbackForm';
import { IFeedbackScaleItemFields } from './components/FeedbackScaleItem';
import FeedbackSuccessPopup from './components/FeedbackSuccessPopup';

export interface IFeedbackPopupFields {
    CommentTitle: ISitecoreField<string>;
    Delay: ISitecoreField<number>;
    IsCommentFieldEnabled: ISitecoreField<boolean>;
    Scale: ISitecoreCompositeField<IFeedbackScaleItemFields>[];
    ScaleTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TFeedbackPopupProps = ISitecoreComponent<IFeedbackPopupFields>;

export const FeedbackPopup = ({ fields }: TFeedbackPopupProps) => {
    const { isScreenMedium, getPhrase, trackEventWithParams } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const [isDrawerOpened, setIsDrawerOpened] = useState<boolean>(false);
    const [isPopupOpened, setIsPopupOpened] = useState<boolean>(false);
    const [isSuccessPopupOpened, setIsSuccessPopupOpened] = useState<boolean>(false);
    const title = fields?.Title?.value || '';

    const onClosePopup = () => {
        setIsPopupOpened(false);
    };

    const onCloseDrawer = () => {
        setIsDrawerOpened(false);
        onClosePopup();
    };

    const onSuccessSubmit = () => {
        onClosePopup();
        setIsSuccessPopupOpened(true);
    };

    const trackClickAction = (cta: string) => {
        trackEventWithParams(
            EventTypes.BookingConfirmationFeedback,
            {
                position: 'Feedback pop up',
                name: title,
                cta,
            },
            undefined,
            true,
            true,
        );
    };

    const trackClickOnMobilePreviewPopup = (cta: string) => {
        trackEventWithParams(EventTypes.BookingConfirmationFeedbackMobile, {
            location: 'Feedback pop up',
            cta,
        });
    };

    useEffect(() => {
        const delay = Number(fields?.Delay?.value);
        let timeoutId;

        if (delay) {
            timeoutId = setTimeout(() => setIsPopupOpened(true), delay);
        } else {
            setIsPopupOpened(true);
        }

        return () => {
            timeoutId && clearTimeout(timeoutId);
        };
    }, []);

    if (!fields) {
        return null;
    }

    if (isSuccessPopupOpened) {
        return <FeedbackSuccessPopup onClose={() => setIsSuccessPopupOpened(false)} />;
    }

    if (isPopupOpened) {
        return (
            <Popup
                containerClass='feedback-popup no-print'
                isToastPopup
                showCloseButton
                disableReturnFocusOnUnmount
                initialFocus={isScreenMedium ? 'input[type=radio]' : '#feedback-popup-confirm'}
                aria-label={title}
                onClose={() => {
                    onClosePopup();
                    isScreenMedium ? trackClickAction('X button') : trackClickOnMobilePreviewPopup('X button');
                }}
            >
                {isScreenMedium ? (
                    <FeedbackForm
                        fields={fields}
                        onSuccessSubmit={onSuccessSubmit}
                        trackClickAction={trackClickAction}
                    />
                ) : (
                    <>
                        {!!title && <h2 className='feedback-popup__subtitle me-4'>{title}</h2>}
                        <Button
                            id='feedback-popup-confirm'
                            isFullWidth
                            onClick={() => {
                                setIsDrawerOpened(true);
                                trackClickOnMobilePreviewPopup(
                                    getPhrase(SitecoreDictionary.FeedbackPopupButtonsGiveFeedback),
                                );
                            }}
                        >
                            {getPhrase(SitecoreDictionary.FeedbackPopupButtonsGiveFeedback)}
                        </Button>

                        <Drawer open={isDrawerOpened} aria-label={title}>
                            <PopupCloseButton
                                onClick={() => {
                                    onCloseDrawer();
                                    trackClickAction('X button');
                                }}
                            />
                            <FeedbackForm
                                isInDrawer
                                fields={fields}
                                onClose={onCloseDrawer}
                                onSuccessSubmit={onSuccessSubmit}
                                trackClickAction={trackClickAction}
                            />
                        </Drawer>
                    </>
                )}
            </Popup>
        );
    }

    return null;
};

export default observer(FeedbackPopup);
