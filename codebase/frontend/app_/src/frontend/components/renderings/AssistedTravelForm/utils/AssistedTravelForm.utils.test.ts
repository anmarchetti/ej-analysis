import { assistedTravelFormFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import { PopupType, Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import { createOnContactUsClick, getPopupProps } from './AssistedTravelForm.utils';

const togglePopupMock = jest.fn();
const redirectMock = jest.fn();
const startFromTheBeginningMock = jest.fn();
const goToFormStartMock = jest.fn();
const goToScreenMock = jest.fn();

describe('AssistedTravelForm.utils', () => {
    describe('getPopupProps', () => {
        it('should return correct props for ContactUs popup', () => {
            const result = getPopupProps(
                PopupType.ContactUs,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.ContactUsPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
        });

        it('should return correct props for BackButtonWarning popup', () => {
            const togglePopupMock = jest.fn();
            const redirectMock = jest.fn();

            const result = getPopupProps(
                PopupType.BackButtonWarning,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.WarningPopupBackButtonFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
                onPrimaryBtnClick: expect.any(Function),
                disableOutsideClick: true,
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);

            result?.onPrimaryBtnClick?.();
            expect(redirectMock).toHaveBeenCalled();
        });

        it('should return correct props for SafetyConfirmation popup', () => {
            const result = getPopupProps(
                PopupType.SafetyConfirmation,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.SafetyConfirmationPopup?.fields,
                onSecondaryBtnClick: expect.any(Function),
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
        });

        it('should return correct props for NoTravelCompanion popup', () => {
            const result = getPopupProps(
                PopupType.NoTravelCompanion,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.NoTravelCompanionPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
        });

        it('should return correct props for SubmissionSuccess popup', () => {
            const result = getPopupProps(
                PopupType.SubmissionSuccess,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.SubmissionSuccessPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
                onPrimaryBtnClick: expect.any(Function),
                disableOutsideClick: true,
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
            expect(startFromTheBeginningMock).toHaveBeenCalled();

            result?.onPrimaryBtnClick?.();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
            expect(redirectMock).toHaveBeenCalled();
        });

        it('should return correct props for SubmissionFailed popup', () => {
            const result = getPopupProps(
                PopupType.SubmissionFailed,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.SubmissionFailedPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
                disableOutsideClick: true,
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
            expect(redirectMock).toHaveBeenCalled();
        });

        it('should return correct props for GoBackToStartWarning popup', () => {
            const result = getPopupProps(
                PopupType.GoBackToStartWarning,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.GoBackToStartWarningPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
                onPrimaryBtnClick: expect.any(Function),
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
            expect(goToFormStartMock).toHaveBeenCalled();
            expect(goToScreenMock).toHaveBeenCalledWith(Screen.Introduction);

            result?.onPrimaryBtnClick?.();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
        });

        it('should return correct props for FailedToLoadAssistedTravelRequests popup', () => {
            const result = getPopupProps(
                PopupType.FailedToLoadAssistedTravelRequests,
                assistedTravelFormFieldsMock,
                togglePopupMock,
                redirectMock,
                startFromTheBeginningMock,
                goToFormStartMock,
                goToScreenMock,
            );

            expect(result).toEqual({
                fields: assistedTravelFormFieldsMock.FailedToLoadPopupFields?.fields,
                onSecondaryBtnClick: expect.any(Function),
                disableOutsideClick: true,
            });

            result?.onSecondaryBtnClick();
            expect(togglePopupMock).toHaveBeenCalledWith(null);
            expect(redirectMock).toHaveBeenCalled();
        });

        it('should return undefined when no popup is visible', () => {
            const result = getPopupProps(
                null,
                assistedTravelFormFieldsMock,
                jest.fn(),
                jest.fn(),
                jest.fn(),
                jest.fn(),
                jest.fn(),
            );

            expect(result).toBeUndefined();
        });
    });

    describe('createOnContactUsClick', () => {
        it('should call togglePopup with ContactUs when contact us link is clicked', () => {
            const togglePopupMock = jest.fn();
            const onContactUsClick = createOnContactUsClick(togglePopupMock);

            const mockEvent = {
                preventDefault: jest.fn(),
                target: { id: 'contact-us-btn' },
            } as unknown as MouseEvent;

            onContactUsClick(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(togglePopupMock).toHaveBeenCalledWith(PopupType.ContactUs);
        });

        it('should NOT toggle popup when other link is clicked', () => {
            const togglePopupMock = jest.fn();
            const onContactUsClick = createOnContactUsClick(togglePopupMock);

            const mockEvent = {
                preventDefault: jest.fn(),
                target: { id: 'other-link' },
            } as unknown as MouseEvent;

            onContactUsClick(mockEvent);
            expect(togglePopupMock).not.toHaveBeenCalled();
        });
    });
});
