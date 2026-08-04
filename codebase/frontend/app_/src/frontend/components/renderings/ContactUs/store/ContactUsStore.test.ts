import { Guid } from 'guid-typescript';

import { DATE_FORMATS } from 'code/dates';
import helpCenterService from 'frontend/services/helpCenter.service';
import { formatDatesRange } from 'frontend/utils/date.utils';
import { ContactFormFields } from 'models/data/contactForm/ContactInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

import { ContactUsStore } from './ContactUsStore';

const mockFormData = {
    departureAndReturnDate: '2022-01-01 - 2022-01-07',
    bookingReference: '1234567',
    about: 'Question',
    question: 'Lorem Ipsum',
    leadPassengerFirstName: 'John',
    leadPassengerLastName: 'Doe',
    emailAddress: 'John@Doe.com',
    isPastHoliday: 'false',
    dialingCode: '44',
    contactNumber: '123456789',
    attachments: [],
    initializeValidationRules: jest.fn(),
};

const mockContactInfo = {
    ...mockFormData,
    isFieldValid: jest.fn(),
    onChangeField: jest.fn(),
    validateField: jest.fn(),
};

const createRootStore = () =>
    ({
        layoutStore: {
            getSetting: jest.fn(),
            getPhrase: jest.fn(p => p),
        },
        appCatalogStore: {
            dialingCodes: { fetchData: jest.fn() },
        },
        reCaptchaStore: { executeReCaptcha: jest.fn() },
        queryParamsStore: {},
    } as any);

let rootStore = createRootStore();

jest.mock('models/data/contactForm/ContactInfo', () => ({
    ...jest.requireActual('models/data/contactForm/ContactInfo'),
    __esModule: true,
    ContactInfo: jest.fn().mockImplementation(() => mockContactInfo),
}));

global.scrollTo = jest.fn();

describe('ContactUsStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01'));
    });

    it('should initialize dialing code and Post Booking query', async () => {
        const isPreBookingQueryEnabled = false;
        const store = new ContactUsStore(rootStore);
        store.initializeFormFromQuery = jest.fn();

        await store.initialize(isPreBookingQueryEnabled);

        expect(store.contactQueryType).toBe(ContactQueryType.PostBooking);
        expect(mockContactInfo.initializeValidationRules).toHaveBeenCalledWith(ContactQueryType.PostBooking, undefined);
        expect(store.initializeFormFromQuery).toHaveBeenCalled();
    });

    it('should not initialize query type', async () => {
        const isPreBookingQueryEnabled = true;
        const store = new ContactUsStore(rootStore);
        await store.initialize(isPreBookingQueryEnabled);

        expect(store.contactQueryType).toBeNull();
    });

    it('should initialize correctly when isBookingNotRequired is true', async () => {
        const store = new ContactUsStore(rootStore);
        await store.initialize(false, true);
        expect(mockContactInfo.initializeValidationRules).toBeCalledWith(ContactQueryType.PostBooking, true);
        expect(mockContactInfo.onChangeField).toHaveBeenCalledWith(ContactFormFields.BookingReference, '');
        expect(rootStore.appCatalogStore.dialingCodes.fetchData).not.toBeCalled();
    });

    it('should initialise dialing code', async () => {
        const store = new ContactUsStore(rootStore);
        await store.initialize(true);
        expect(rootStore.appCatalogStore.dialingCodes.fetchData).toBeCalled();
    });

    it('should clear store', async () => {
        const store = new ContactUsStore(rootStore);
        store.isDatePickerOpen = true;
        store.clearStore();
        expect(store.isDatePickerOpen).toBeFalsy();
    });

    it('should generate form data correctly', async () => {
        const store = new ContactUsStore(rootStore);
        const response = Object.fromEntries(store.formData);
        const expected = {
            departureAndReturnDate: mockFormData.departureAndReturnDate,
            bookingReference: mockFormData.bookingReference,
            about: mockFormData.about,
            question: mockFormData.question,
            leadPassengerFirstName: mockFormData.leadPassengerFirstName,
            leadPassengerLastName: mockFormData.leadPassengerLastName,
            emailAddress: mockFormData.emailAddress,
            isPastHoliday: mockFormData.isPastHoliday,
            contactNumber: `+(${mockFormData.dialingCode})${mockFormData.contactNumber}`,
            attachments: '',
        };
        expect(response).toEqual(expected);
    });

    it('should get correct string for holidays in the past', async () => {
        const store = new ContactUsStore(rootStore);
        const response = store._pastString;
        expect(rootStore.layoutStore.getPhrase).toBeCalled();
        expect(response).toBe(SitecoreDictionary.ContactUsButtonsPastHoliday);
    });

    it('should set correct isFutureDates', async () => {
        const store = new ContactUsStore(rootStore);
        expect(store.isFutureDates).toBe(false);
    });

    it('should set correct isFutureDates in future', async () => {
        const store = new ContactUsStore(rootStore);
        store.departure = new Date('3022-01-01');
        store.arrival = new Date('3022-01-10');
        store.confirmDates();
        expect(store.isFutureDates).toBe(true);
    });

    it('should get correct value for formSubmittedPopup', async () => {
        const store = new ContactUsStore(rootStore);
        expect(store.formSubmittedPopup).toBeFalsy();
        store.isShowSuccessMessage = true;
        expect(store.formSubmittedPopup).toBeTruthy();
    });

    it('should update force error', async () => {
        const store = new ContactUsStore(rootStore);
        store.toggleForceErrors(true);
        expect(store.forceErrors).toBeTruthy();
    });

    it('should close submit message', async () => {
        const store = new ContactUsStore(rootStore);
        store.isShowSuccessMessage = true;
        store.closeSubmitMessage();
        expect(store.isShowSuccessMessage).toBeFalsy();
    });

    it('should reset form and set new form key', () => {
        Guid.create = jest.fn().mockReturnValueOnce('id-1').mockReturnValue('id-2');

        const store = new ContactUsStore(rootStore);

        expect(store.formKey).toBe('id-1');

        store.resetForm();

        expect(store.forceErrors).toBeFalsy();
        expect(store.formKey).toBe('id-2');
    });

    it('should submitContactForm success', async () => {
        helpCenterService.sendContactForm = jest.fn().mockResolvedValueOnce({ data: { caseNumber: '00005778' } });
        const store = new ContactUsStore(rootStore);
        const resetFormMock = jest.spyOn(store, 'resetForm');

        await store.submitContactForm();
        expect(helpCenterService.sendContactForm).toBeCalled();
        expect(resetFormMock).toBeCalled();
        expect(store.isShowSuccessMessage).toBeTruthy();
        expect(store.isSubmitFailed).toBeFalsy();
    });

    it('should submitContactForm fail', async () => {
        helpCenterService.sendContactForm = jest.fn().mockRejectedValueOnce(new Error());
        const store = new ContactUsStore(rootStore);

        await store.submitContactForm();
        expect(store.isShowSuccessMessage).toBeFalsy();
        expect(store.isSubmitFailed).toBeTruthy();
    });

    it('should close on holiday popup', () => {
        const store = new ContactUsStore(rootStore);
        store.currentlyOnHoliday = true;
        store.closeOnHolidayPopup();
        expect(store.currentlyOnHoliday).toBeFalsy();
    });

    it('should return selected dates', () => {
        const departure = new Date('2022-01-01');
        const arrival = new Date('2022-01-10');
        const store = new ContactUsStore(rootStore);
        expect(store.currentDates).toStrictEqual([]);

        store.departure = departure;
        expect(store.currentDates).toStrictEqual([departure]);

        store.arrival = arrival;
        expect(store.currentDates).toStrictEqual([departure, arrival]);
    });

    it('should return date of Holiday', () => {
        const departure = new Date('2022-01-01');
        const arrival = new Date('2022-01-10');
        const format = formatDatesRange(departure, arrival, DATE_FORMATS.L);
        const store = new ContactUsStore(rootStore);

        store.departure = departure;
        store.arrival = arrival;
        expect(store.dateOfHoliday).toBe(format);
    });

    it('should return is past holiday string', () => {
        const store = new ContactUsStore(rootStore);
        store.isPastHoliday = true;
        store._showPastString = true;
        expect(store.dateOfHoliday).toBe(SitecoreDictionary.ContactUsButtonsPastHoliday);
    });

    it('should return number of nights', () => {
        const store = new ContactUsStore(rootStore);

        expect(store.numberOfNights).toBe(0);

        store.departure = new Date('2022-01-01');
        store.arrival = new Date('2022-01-10');
        expect(store.numberOfNights).toBe(9);
    });

    it('should toggle date picker', () => {
        const store = new ContactUsStore(rootStore);

        store.toggleDatePicker();
        expect(store.isDatePickerOpen).toBeTruthy();

        store.toggleDatePicker();
        expect(store.isDatePickerOpen).toBeFalsy();
    });

    it('should correctly confirm dates', () => {
        const store = new ContactUsStore(rootStore);

        store.departure = new Date('2022-01-01');
        store.arrival = new Date('2022-01-10');
        store.confirmDates();
        expect(mockContactInfo.onChangeField).toBeCalled();
    });

    it('should set on holiday to tue', () => {
        const store = new ContactUsStore(rootStore);
        const date = new Date();
        date.setDate(date.getDate() + 10);
        store.arrival = date;
        store.departure = new Date('2022-01-01');
        store.confirmDates();
        expect(store.currentlyOnHoliday).toBeTruthy();
    });

    it('should set past holiday', () => {
        const store = new ContactUsStore(rootStore);
        store.setPastHoliday();
        expect(store.isPastHoliday).toBeTruthy();
    });

    it('should set query type and reset form', () => {
        const store = new ContactUsStore(rootStore);
        const mockResetForm = jest.spyOn(store, 'resetForm');

        store.setContactQueryType(ContactQueryType.PostBooking);

        expect(store.contactQueryType).toBe(ContactQueryType.PostBooking);
        expect(mockResetForm).toHaveBeenCalledWith(ContactQueryType.PostBooking);
    });

    describe('initialize contact form', () => {
        beforeEach(() => {
            rootStore.queryParamsStore = {
                bookingRefFromUrl: '1234',
                leadFirstNameFromUrl: 'Test',
                leadLastNameFromUrl: 'X',
                email: 'test@test.com',
            };
        });

        it('should initialize contact form fields from query', () => {
            const store = new ContactUsStore(rootStore);

            store.setDates = jest.fn();
            store.initializeFormFromQuery();

            expect(store.contactInfo.bookingReference).toBe(rootStore.queryParamsStore.bookingRefFromUrl);
            expect(store.contactInfo.leadPassengerFirstName).toBe(rootStore.queryParamsStore.leadFirstNameFromUrl);
            expect(store.contactInfo.leadPassengerLastName).toBe(rootStore.queryParamsStore.leadLastNameFromUrl);
            expect(store.contactInfo.emailAddress).toBe(rootStore.queryParamsStore.email);
            expect(store.setDates).not.toHaveBeenCalled();
        });

        it('should initialize contact form date fields from query', () => {
            rootStore.queryParamsStore.dateStartFromUrl = '2022-01-01';
            rootStore.queryParamsStore.dateEndFromUrl = '2022-01-02';

            const store = new ContactUsStore(rootStore);

            store.setDates = jest.fn();
            store.initializeFormFromQuery();

            expect(store.setDates).toHaveBeenCalledWith([
                new Date(rootStore.queryParamsStore.dateStartFromUrl),
                new Date(rootStore.queryParamsStore.dateEndFromUrl),
            ]);
        });

        it('should initialize contact form date fields from query with future dates', () => {
            rootStore.queryParamsStore.dateStartFromUrl = '3022-01-01';
            rootStore.queryParamsStore.dateEndFromUrl = '3022-01-02';

            const store = new ContactUsStore(rootStore);

            store.setDates = jest.fn();
            store.initializeFormFromQuery();

            expect(store.setDates).toHaveBeenCalledWith([
                new Date(rootStore.queryParamsStore.dateStartFromUrl),
                new Date(rootStore.queryParamsStore.dateEndFromUrl),
            ]);
            expect(store.isPastHoliday).toBe(false);
        });

        it('should not initialize date fields from query when end date is not defined', () => {
            rootStore.queryParamsStore.dateStartFromUrl = '2022-01-01';
            rootStore.queryParamsStore.dateEndFromUrl = undefined;

            const store = new ContactUsStore(rootStore);
            store.setDates = jest.fn();
            store.initializeFormFromQuery();

            expect(store.setDates).not.toHaveBeenCalled();
        });

        it('should set isPastHoliday as true depending on dates in setPastHoliday', () => {
            const store = new ContactUsStore(rootStore);
            store.departure = new Date('2022-01-01');
            store.arrival = new Date('2022-01-10');
            store.setDates([store.departure, store.arrival]);

            expect(store.isPastHoliday).toBe(true);
        });

        it('should set isPastHoliday as false depending on dates in setPastHoliday', () => {
            const store = new ContactUsStore(rootStore);
            store.departure = new Date('3022-01-01');
            store.arrival = new Date('3022-01-10');
            store.setDates([store.departure, store.arrival]);

            expect(store.isPastHoliday).toBe(false);
        });

        it('should set isPastHoliday as false when dates not provided', () => {
            const store = new ContactUsStore(rootStore);
            store.departure = null;
            store.arrival = null;
            store.setDates([]);

            expect(store.isPastHoliday).toBe(false);
        });
    });
});
