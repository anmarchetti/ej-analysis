import { IPopupProps } from 'frontend/components/renderings/AssistedTravelForm/components/Popup/Popup';
import { IAssistedTravelFormFields } from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import { PopupType, Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

export const createOnContactUsClick =
    (togglePopup: (popup: PopupType | null) => void) =>
    (e: MouseEvent): void => {
        if ((e.target as HTMLElement).id === 'contact-us-btn') {
            e.preventDefault();
            togglePopup(PopupType.ContactUs);
        }
    };

export const getPopupProps = (
    visiblePopup: PopupType | null,
    fields: IAssistedTravelFormFields,
    togglePopup: (popup: PopupType | null) => void,
    redirectToViewBookingPage: () => void,
    startFromTheBeginning: () => void,
    goToFormStart: () => void,
    goToScreen: (screen: Screen) => void,
): IPopupProps | undefined => {
    switch (visiblePopup) {
        case PopupType.ContactUs:
            return {
                fields: fields.ContactUsPopupFields?.fields,
                onSecondaryBtnClick: () => togglePopup(null),
            };
        case PopupType.BackButtonWarning:
            return {
                fields: fields.WarningPopupBackButtonFields?.fields,
                onSecondaryBtnClick: (): void => {
                    togglePopup(null);
                    redirectToViewBookingPage();
                },
                onPrimaryBtnClick: () => togglePopup(null),
                disableOutsideClick: true,
            };
        case PopupType.SafetyConfirmation:
            return {
                fields: fields.SafetyConfirmationPopup?.fields,
                onSecondaryBtnClick: () => togglePopup(null),
            };
        case PopupType.NoTravelCompanion:
            return {
                fields: fields.NoTravelCompanionPopupFields?.fields,
                onSecondaryBtnClick: () => togglePopup(null),
            };
        case PopupType.SubmissionSuccess:
            return {
                fields: fields.SubmissionSuccessPopupFields?.fields,
                onSecondaryBtnClick: (): void => {
                    togglePopup(null);
                    startFromTheBeginning();
                },
                onPrimaryBtnClick: (): void => {
                    togglePopup(null);
                    redirectToViewBookingPage();
                },
                disableOutsideClick: true,
            };
        case PopupType.SubmissionFailed:
            return {
                fields: fields.SubmissionFailedPopupFields?.fields,
                onSecondaryBtnClick: (): void => {
                    togglePopup(null);
                    redirectToViewBookingPage();
                },
                disableOutsideClick: true,
            };
        case PopupType.GoBackToStartWarning:
            return {
                fields: fields.GoBackToStartWarningPopupFields?.fields,
                onSecondaryBtnClick: (): void => {
                    togglePopup(null);
                    goToFormStart();
                    goToScreen(Screen.Introduction);
                },
                onPrimaryBtnClick: (): void => {
                    togglePopup(null);
                },
            };

        case PopupType.FailedToLoadAssistedTravelRequests:
            return {
                fields: fields.FailedToLoadPopupFields?.fields,
                onSecondaryBtnClick: (): void => {
                    togglePopup(null);
                    redirectToViewBookingPage();
                },
                disableOutsideClick: true,
            };
        default:
            return undefined;
    }
};
