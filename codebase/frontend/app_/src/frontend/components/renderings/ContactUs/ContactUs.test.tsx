import React, { act } from 'react';
import selectEvent from 'react-select-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import useReCaptcha from 'frontend/hooks/useReCaptcha';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
jest.mock('frontend/hooks/useReCaptcha');

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockContactUsFields } from 'frontend/__mocks__/contactUs';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { ContactFormFields } from 'models/data/contactForm/ContactInfo';
import ContactUs, { IContactUsProps } from 'frontend/components/renderings/ContactUs/ContactUs';
import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

const createProps = (): IContactUsProps => ({
    fields: mockContactUsFields,
});

const createLocalStore = () => ({
    isDatePickerOpen: false,
    contactInfo: {
        departureAndReturnDate: '',
        dialingCode: '',
        contactNumber: '',
        isValid: false,
        isValidField: jest.fn(() => true),
        validateField: jest.fn(),
        onChangeField: jest.fn(),
    },
    formKey: 'formKey',
    forceErrors: false,
    isSubmitting: false,
    currentDates: [],
    currentlyOnHoliday: false,
    formSubmittedPopup: false,
    isShowSuccessMessage: false,
    numberOfNights: 0,
    dateOfHoliday: '',
    isFutureDates: false,
    isRecaptchEnabled: true,
    contactQueryType: ContactQueryType.PostBooking as Nullable<ContactQueryType>,
    initialize: jest.fn(),
    toggleDatePicker: jest.fn(),
    clearDates: jest.fn(),
    confirmDates: jest.fn(),
    clearStore: jest.fn(),
    toggleForceErrors: jest.fn(),
    submitContactForm: jest.fn(),
    closeOnHolidayPopup: jest.fn(),
    closeSubmitMessage: jest.fn(),
    closeDatePicker: jest.fn(),
    setContactQueryType: jest.fn(),
});

let mockLocalStore = createLocalStore();

jest.mock('frontend/components/renderings/ContactUs/store/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/ContactUs/store/createStore'),
    useContactUsStore: () => mockLocalStore,
}));

const mockDrawer = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawer(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

const mockCalendarWrapper = jest.fn();
jest.mock('frontend/components/renderings/ContactUs/components/CalendarWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCalendarWrapper(props);

        return <div data-tid='calendar-wrapper' />;
    },
}));

const mockContactFormDatePicker = jest.fn();
jest.mock('frontend/components/renderings/ContactUs/components/ContactFormDatePicker', () => ({
    __esModule: true,
    default: props => {
        mockContactFormDatePicker(props);

        return <div data-tid='contact-form-date-picker' />;
    },
}));

let mockProps = createProps();
let mockStores;

export const mockFields = {};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichText = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field, dataId }) => {
    mockRichText(field.value);

    return <div data-tid={dataId} />;
});

const mockFakeInputProps = jest.fn();
jest.mock('./components/FakeDatePicker/FakeDatePicker', () => props => {
    mockFakeInputProps(props);

    return <button data-tid={'fake-input'} onClick={props.onClick} />;
});

const mockValidatableField = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => props => {
    mockValidatableField(props);

    return <input data-tid={props.id} {...props} aria-label={props.label} />;
});

jest.mock('frontend/components/common/RouterLink', () => () => null);

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    setBodyOverflow: jest.fn(),
    lockBodyScroll: jest.fn(),
    unLockBodyScroll: jest.fn(),
    scrollToErrorBlock: jest.fn(),
}));

global.scrollTo = jest.fn();

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: jest.fn(),
}));

const mockedScrollToError = scrollToErrorBlock as jest.MockedFn<typeof scrollToErrorBlock>;

describe('<ContactUs />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockLocalStore = createLocalStore();
        mockStores = createMockStores({
            layoutStore: { getPhrase: jest.fn(p => p), getSetting: jest.fn().mockResolvedValue(true) },
            trackingStore: { trackValidation: jest.fn() },
            appCatalogStore: {
                dialingCodesSelectOptions: [
                    { value: '44', label: '(+44) United Kingdom' },
                    { value: '93', label: '(+93) Afghanistan' },
                ],
            },
        });
        mockProps = createProps();
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
    });

    describe('Initial Form State', () => {
        it('should render component', () => {
            render(<ContactUs {...mockProps} />);
            expect(screen.getByText(mockProps.fields.FormTitle.value)).toBeInTheDocument();
            expect(mockRichText).toHaveBeenCalledWith(mockProps.fields.FormDescription.value);
            expect(screen.queryByTestId('no-booking-yet')).not.toBeInTheDocument();
            expect(useReCaptcha).toBeCalled();
        });

        it('should be empty', () => {
            mockStores.layoutStore.getSetting.mockResolvedValueOnce(false);
            const { queryByText } = render(<ContactUs {...mockProps} />);
            expect(queryByText(mockProps.fields.FormTitle.value)).toBeInTheDocument();
        });

        it('should call initialize on first render', () => {
            render(<ContactUs {...mockProps} />);
            expect(mockLocalStore.initialize).toBeCalled();
        });

        it('should NOT show form fields', () => {
            const { queryByText } = render(<ContactUs {...mockProps} />);
            expect(queryByText(mockProps.fields.BookingReferenceTitle.value)).not.toBeInTheDocument();
        });
    });

    describe('Date Picker', () => {
        it('should call toggle', async () => {
            render(<ContactUs {...mockProps} />);
            await userEvent.click(screen.getByTestId('fake-input'));
            expect(mockLocalStore.toggleDatePicker).toHaveBeenCalled();
        });

        it('should render DatePicker correctly', () => {
            mockLocalStore.isDatePickerOpen = true;
            render(<ContactUs {...mockProps} />);
            expect(mockContactFormDatePicker).toHaveBeenCalledWith(
                expect.objectContaining({
                    dateOfHoliday: '',
                    monthLimit: mockProps.fields.DatePickerMonthLimit.value,
                    placeholder: mockProps.fields.DepartureAndReturnDatesPlaceholder.value,
                    text: mockProps.fields.DatePickerText,
                    title: mockProps.fields.DatePickerTitle,
                }),
            );

            expect(mockCalendarWrapper).not.toHaveBeenCalled();
        });

        it('should render DatePicker correctly on mobile', () => {
            mockLocalStore.isDatePickerOpen = true;
            jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);

            render(<ContactUs {...mockProps} />);
            expect(mockDrawer).toHaveBeenCalledWith(
                expect.objectContaining({
                    open: true,
                }),
            );
            expect(mockCalendarWrapper).toHaveBeenCalledWith({
                monthLimit: mockProps.fields.DatePickerMonthLimit.value,
            });

            expect(mockContactFormDatePicker).not.toHaveBeenCalled();
        });
    });

    describe('Form Fields', () => {
        beforeEach(() => {
            mockLocalStore.contactInfo.departureAndReturnDate = '29/11/2022 - 30/11/2022';
        });

        it('should render NoBooking Checkbox', () => {
            mockLocalStore.isFutureDates = true;
            render(<ContactUs {...mockProps} />);
            expect(screen.getByTestId('no-booking-yet')).toBeInTheDocument();
        });

        it('should render yes and no radio buttons when isPreBookingQueryEnabled', async () => {
            mockLocalStore.isFutureDates = true;
            mockProps.fields.IsPreBookingQueryEnabled = mockSitecoreField(true);

            render(<ContactUs {...mockProps} />);
            const noOption = screen.getByTestId('no-option');
            expect(screen.getByTestId('contact-have-booking-label')).toBeInTheDocument();
            expect(screen.getByTestId('yes-option').childNodes[0]).toBeChecked();
            expect(noOption.childNodes[0]).not.toBeChecked();
            await userEvent.click(noOption);
            expect(mockLocalStore.setContactQueryType).toHaveBeenCalledWith(ContactQueryType.PreBooking);
        });

        it('should remove bookingReference field if NoBooking checkbox selected', () => {
            mockLocalStore.contactInfo.departureAndReturnDate = '29/11/3022 - 30/11/3022';
            mockLocalStore.isFutureDates = true;
            render(<ContactUs {...mockProps} />);
            expect(screen.getByTestId('bookingReference')).toBeInTheDocument();

            const checkbox = screen.getByTestId('no-booking-yet');
            fireEvent.click(checkbox);

            expect(screen.queryByTestId('bookingReference')).not.toBeInTheDocument();
        });

        it('should call onChangeField', async () => {
            const { getByLabelText } = render(<ContactUs {...mockProps} />);

            const {
                BookingReferencePlaceholder,
                QuestionOptionsPlaceholder,
                QuestionLabel,
                DetailsEmailPlaceholder,
                DetailsFirstNamePlaceholder,
                DetailsContactNumberPlaceholder,
                DetailsLastNamePlaceholder,
            } = mockProps.fields;

            const fields = [
                BookingReferencePlaceholder.value,
                QuestionLabel.value,
                DetailsFirstNamePlaceholder.value,
                DetailsLastNamePlaceholder.value,
                DetailsEmailPlaceholder.value,
                DetailsContactNumberPlaceholder.value,
            ];

            await selectEvent.select(getByLabelText(QuestionOptionsPlaceholder.value), 'Amend booking');

            fields.forEach(field => {
                fireEvent.change(getByLabelText(field), { target: { value: 'test' } });
            });

            fireEvent.change(getByLabelText(SitecoreDictionary.GlobalsSubmitFile), { target: { value: [] } });

            expect(mockLocalStore.contactInfo.onChangeField).toHaveBeenCalledTimes(fields.length + 2);
        });

        it('should replace break line from string to space', () => {
            let res;
            mockLocalStore.contactInfo.onChangeField = jest.fn((p, v) => (res = v));
            render(<ContactUs {...mockProps} />);

            const question = screen.getByTestId('question-text-area');
            fireEvent.change(question, { target: { value: 'te\nst' } });

            expect(res).toBe('te st');
        });

        it('should preventDefault when clicking enter in ValidatableTextarea', () => {
            render(<ContactUs {...mockProps} />);

            const question = screen.getByTestId('question-text-area');

            const isPrevented = fireEvent.keyDown(question, { code: 'Enter' });
            expect(isPrevented).toBe(false);
        });

        it('should NOT preventDefault when clicking other button than enter in ValidatableTextarea', () => {
            render(<ContactUs {...mockProps} />);

            const question = screen.getByTestId('question-text-area');

            const isPrevented = fireEvent.keyDown(question, { code: 'test' });
            expect(isPrevented).toBe(true);
        });

        it('should call onChangeField on dialing code', async () => {
            mockLocalStore.contactInfo.contactNumber = '123456789';
            mockLocalStore.contactInfo.dialingCode = '44';
            const { getByLabelText } = render(<ContactUs {...mockProps} />);

            await selectEvent.select(
                getByLabelText(mockProps.fields.DetailsCodePlaceholder.value),
                '(+44) United Kingdom',
            );
            expect(mockLocalStore.contactInfo.onChangeField).toBeCalled();
        });

        it('should set labelClass depending on phoneState', () => {
            render(<ContactUs {...mockProps} />);

            act(() => {
                mockValidatableField.mock.calls[4][0].onFocus();
            });

            expect(mockValidatableField).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: ContactFormFields.ContactNumber,
                    labelClass: 'form-control__label--active',
                }),
            );

            mockValidatableField.mock.calls[4][0].onBlur();
            expect(mockValidatableField).toHaveBeenCalledWith(
                expect.objectContaining({ id: ContactFormFields.ContactNumber, labelClass: '' }),
            );
        });

        it('should NOT set state if number is set', () => {
            mockLocalStore.contactInfo.contactNumber = '123456789';
            render(<ContactUs {...mockProps} />);

            act(() => {
                mockValidatableField.mock.calls[4][0].onFocus();
            });

            expect(mockValidatableField).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: ContactFormFields.ContactNumber,
                    labelClass: 'form-control__label--active',
                }),
            );

            mockValidatableField.mock.calls[4][0].onBlur();
            expect(mockValidatableField).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: ContactFormFields.ContactNumber,
                    labelClass: 'form-control__label--active',
                }),
            );
        });

        it('should submit data if form is valid and clear state of phone input', async () => {
            mockLocalStore.contactInfo.isValid = true;
            mockLocalStore.contactInfo.departureAndReturnDate = '29/11/3022 - 30/11/3022';
            mockLocalStore.isFutureDates = true;
            mockLocalStore.contactInfo.contactNumber = '123456789';
            mockLocalStore.submitContactForm.mockResolvedValueOnce(true);
            const { rerender } = render(<ContactUs {...mockProps} />);
            mockValidatableField.mock.calls[4][0].onFocus();
            const checkbox = screen.getByTestId('no-booking-yet');
            fireEvent.click(checkbox);
            await userEvent.click(screen.getByText(SitecoreDictionary.GlobalsSubmitRequest));
            expect(mockLocalStore.submitContactForm).toBeCalled();
            rerender(<ContactUs {...mockProps} />);
            expect(screen.getByTestId('no-booking-yet')).toBeInTheDocument();
            expect(screen.getByTestId('bookingReference')).toBeInTheDocument();
            expect(mockValidatableField).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: ContactFormFields.ContactNumber,
                    labelClass: '',
                }),
            );
        });

        it('should NOT submit data if query type not defined', async () => {
            mockLocalStore.contactInfo.isValid = true;
            mockLocalStore.contactQueryType = null;
            const { getByText } = render(<ContactUs {...mockProps} />);
            await userEvent.click(getByText(SitecoreDictionary.GlobalsSubmitRequest));

            expect(mockLocalStore.submitContactForm).not.toBeCalled();
        });

        it('should NOT submit data and scroll to errors if form is NOT valid', async () => {
            const { getByText } = render(<ContactUs {...mockProps} />);
            await userEvent.click(getByText(SitecoreDictionary.GlobalsSubmitRequest));

            await waitFor(() => expect(mockLocalStore.toggleForceErrors).toBeCalled());
            expect(mockedScrollToError).toBeCalled();
        });

        it('should scroll to errors if submit is failed', async () => {
            mockLocalStore.contactInfo.isValid = true;
            mockLocalStore.submitContactForm.mockRejectedValueOnce(new Error());
            const { getByText } = render(<ContactUs {...mockProps} />);
            await userEvent.click(getByText(SitecoreDictionary.GlobalsSubmitRequest));

            await waitFor(() => expect(mockLocalStore.toggleForceErrors).toBeCalled());
            expect(mockedScrollToError).toBeCalled();
        });
    });

    describe('Popup messages', () => {
        it('should show success message', () => {
            mockLocalStore.formSubmittedPopup = true;
            mockLocalStore.isShowSuccessMessage = true;
            const { getByText } = render(<ContactUs {...mockProps} />);
            expect(getByText(mockProps.fields.SuccessTitle.value)).toBeInTheDocument();
        });

        it('should show error message', () => {
            mockLocalStore.formSubmittedPopup = true;
            const { getByText } = render(<ContactUs {...mockProps} />);
            expect(getByText(mockProps.fields.FailedTitle.value)).toBeInTheDocument();
        });

        it('should show On Holiday message', () => {
            mockLocalStore.currentlyOnHoliday = true;
            const { getByText } = render(<ContactUs {...mockProps} />);
            expect(getByText(mockProps.fields.OnHolidayTitle.value)).toBeInTheDocument();
        });
    });
});
