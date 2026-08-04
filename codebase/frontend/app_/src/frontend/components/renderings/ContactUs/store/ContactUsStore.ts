import { Guid } from 'guid-typescript';
import { action, makeObservable, observable } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import helpCenterService from 'frontend/services/helpCenter.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { formatDatesRange, getDaysDifference, isDateInRange, isExpired } from 'frontend/utils/date.utils';
import { convertBooleanToString } from 'frontend/utils/string.utils';
import { ContactFormFields, ContactInfo } from 'models/data/contactForm/ContactInfo';
import { ReCaptchaAction } from 'models/enum/ReCaptchaAction';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

export class ContactUsStore {
    // Contact Form Info
    @observable contactInfo = new ContactInfo();

    // Contact Query Type (Post or Pre Booking)
    _initialContactQueryType: Nullable<ContactQueryType> = null;
    @observable contactQueryType: Nullable<ContactQueryType> = null;

    // Form Variables
    @observable forceErrors: boolean = false;
    @observable formKey: string = Guid.create().toString();
    @observable isSubmitting: boolean = false;
    @observable isSubmitFailed: boolean = false;
    @observable isShowSuccessMessage: boolean = false;
    @observable caseNumber: string;

    @observable currentlyOnHoliday: boolean = false;

    // Date Picker Variables
    @observable isDatePickerOpen: boolean = false;
    @observable departure: Date | null;
    @observable arrival: Date | null;
    @observable isPastHoliday: boolean = false;

    _savedDeparture: Date | null;
    _savedArrival: Date | null;
    _savedIsPastHoliday: boolean;
    _savedShowPastString: boolean;

    _showPastString: boolean = false;

    constructor(private rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action initialize = async (isPreBookingQueryEnabled: boolean, isBookingNotRequired?: boolean): Promise<void> => {
        // By default, the contact form is only for Post Booking queries (i.e. user already has booking).
        // For some markets, it can be used for both Pre and Post Booking queries if it's enabled on sitecore (EUX-626).
        if (!isPreBookingQueryEnabled) {
            this.initializeContactQueryType(ContactQueryType.PostBooking, isBookingNotRequired);
        }

        if (isBookingNotRequired) {
            this.contactInfo.onChangeField(ContactFormFields.BookingReference, '');

            return;
        }

        const { getSetting } = this.rootStore.layoutStore;
        await Promise.all([this.rootStore.appCatalogStore.dialingCodes.fetchData()]);
        this.contactInfo.onChangeField(
            ContactFormFields.DialingCode,
            getSetting(SiteSettings.DefaultDialingCode) || '',
        );

        this.initializeFormFromQuery();
    };

    @action initializeFormFromQuery = (): void => {
        const {
            dateStartFromUrl,
            dateEndFromUrl,
            bookingRefFromUrl,
            leadFirstNameFromUrl,
            leadLastNameFromUrl,
            email,
        } = this.rootStore.queryParamsStore;

        this.contactInfo.bookingReference = bookingRefFromUrl;
        this.contactInfo.leadPassengerFirstName = leadFirstNameFromUrl;
        this.contactInfo.leadPassengerLastName = leadLastNameFromUrl;
        this.contactInfo.emailAddress = email;

        if (dateStartFromUrl && dateEndFromUrl) {
            this.setDates([new Date(dateStartFromUrl), new Date(dateEndFromUrl)]);
            this.contactInfo.departureAndReturnDate = formatDatesRange(
                dateStartFromUrl,
                dateEndFromUrl,
                DATE_FORMATS.L,
            );
        }
    };

    @action initializeContactQueryType = (
        queryType: Nullable<ContactQueryType>,
        isBookingNotRequired?: boolean,
    ): void => {
        this._initialContactQueryType = queryType;
        this.contactQueryType = queryType;
        this.contactInfo.initializeValidationRules(queryType, isBookingNotRequired);
    };

    @action clearStore = (): void => {
        this.isDatePickerOpen = false;
        this.isPastHoliday = false;
        this.departure = null;
        this.arrival = null;
        this._savedDeparture = null;
        this._savedArrival = null;
        this.contactInfo = new ContactInfo();
    };

    /** Checks to see if contact us specific recaptcha is enabled. Will be ignored if global recaptcha is enabled */
    get isRecaptchaEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsReCaptchaEnabledContactUs);
    }

    // Form Logic
    get formData(): FormData {
        const formData = new FormData();
        const files = this.contactInfo.attachments?.length ? this.contactInfo.attachments : null;
        const contactNumber = this.contactInfo.contactNumber
            ? `+(${this.contactInfo.dialingCode})${this.contactInfo.contactNumber}`
            : '';

        formData.append(ContactFormFields.DepartureAndReturnDate, this.contactInfo.departureAndReturnDate);
        formData.append(ContactFormFields.BookingReference, this.contactInfo.bookingReference);
        formData.append(ContactFormFields.About, this.contactInfo.about);
        formData.append(ContactFormFields.Question, this.contactInfo.question);
        formData.append(ContactFormFields.LeadPassengerFirstName, this.contactInfo.leadPassengerFirstName);
        formData.append(ContactFormFields.LeadPassengerLastName, this.contactInfo.leadPassengerLastName);
        formData.append(ContactFormFields.EmailAddress, this.contactInfo.emailAddress);
        formData.append(ContactFormFields.ContactNumber, contactNumber);

        if (files?.length) {
            files.forEach(file => {
                formData.append(ContactFormFields.Attachments, file as Blob, file.name);
            });
        } else {
            formData.append(ContactFormFields.Attachments, '');
        }

        formData.append('isPastHoliday', convertBooleanToString(this.isPastHoliday));

        return formData;
    }

    get _pastString(): string {
        return this.rootStore.layoutStore.getPhrase(SitecoreDictionary.ContactUsButtonsPastHoliday);
    }

    get formSubmittedPopup(): boolean {
        return this.isShowSuccessMessage || this.isSubmitFailed;
    }

    @action toggleForceErrors = (state: boolean): void => {
        this.forceErrors = state;
    };

    @action closeSubmitMessage = (): void => {
        this.isShowSuccessMessage = false;
        this.isSubmitFailed = false;
    };

    @action resetForm = (queryType?: Nullable<ContactQueryType>): void => {
        const { getSetting } = this.rootStore.layoutStore;

        this.isPastHoliday = false;
        this._savedDeparture = null;
        this._savedArrival = null;
        this.forceErrors = false;
        this.contactQueryType = queryType !== undefined ? queryType : this._initialContactQueryType;
        this.contactInfo = new ContactInfo(this.contactQueryType);
        this.clearDates();
        this.contactInfo.onChangeField(
            ContactFormFields.DialingCode,
            getSetting(SiteSettings.DefaultDialingCode) || '',
        );

        // Update key, because it force to remount form component.
        // (It'is necessary in order to clear all touch/ blur states of form fields and hide errors)
        this.formKey = Guid.create().toString();
    };

    @action submitContactForm = async (): Promise<void> => {
        this.isSubmitting = true;
        try {
            const captcha = await this.rootStore.reCaptchaStore.executeReCaptcha(ReCaptchaAction.Contact);
            const response = await helpCenterService.sendContactForm(this.formData, captcha);

            this.isShowSuccessMessage = true;
            this.caseNumber = response.data.caseNumber;

            window.scrollTo(0, 0);
            this.resetForm();
        } catch (e) {
            this.isSubmitFailed = true;
        } finally {
            this.isSubmitting = false;
        }
    };

    @action closeOnHolidayPopup = (): void => {
        this.currentlyOnHoliday = false;
        this.showDatePicker(false);
    };

    // Date Picker Logic
    get currentDates(): Date[] {
        if (this.departure && this.arrival) {
            return [this.departure, this.arrival];
        }

        if (this.departure) {
            return [this.departure];
        }

        return [];
    }

    get dateOfHoliday(): string {
        if (this.isPastHoliday && this._showPastString) {
            return this._pastString;
        }

        return this.departure ? formatDatesRange(this.departure, this.arrival, DATE_FORMATS.L) : '';
    }

    get numberOfNights(): number {
        if (!this.departure || !this.arrival) {
            return 0;
        }

        return getDaysDifference(this.arrival, this.departure);
    }

    get isFutureDates(): boolean {
        return (this.departure || new Date(0)) > new Date();
    }

    @action toggleDatePicker = (): void => {
        this.isDatePickerOpen ? this.closeDatePicker() : this.showDatePicker();
    };

    @action showDatePicker = (clone: boolean = true): void => {
        if (clone) this._cloneCurrentValues();

        this.isDatePickerOpen = true;
    };

    @action closeDatePicker = (restore: boolean = true): void => {
        if (restore) {
            this._restoreFromClone();
        }

        this.isDatePickerOpen = false;
    };

    @action confirmDates = (): void => {
        if (this.currentDates.length !== 2) {
            return;
        }

        this.closeDatePicker(false);

        const today = new Date().setHours(0, 0, 0, 0);
        this.currentlyOnHoliday = isDateInRange(new Date(today), this.departure as Date, this.arrival as Date);

        if (!this.currentlyOnHoliday) {
            this.contactInfo.onChangeField(ContactFormFields.DepartureAndReturnDate, this.dateOfHoliday);

            if (this.arrival) {
                this.isPastHoliday = isExpired(this.arrival.toISOString(), DATE_FORMATS.isoString);
            }
        }
    };

    @action setDates = (dates: Date[]): void => {
        if (dates) {
            this.departure = dates[0] ?? null;
            this.arrival = dates[1] ?? null;
            this.isPastHoliday = this.arrival ? isExpired(this.arrival.toISOString(), DATE_FORMATS.isoString) : false;
            this._showPastString = false;
        }
    };

    @action clearDates = (): void => {
        this.departure = null;
        this.arrival = null;
        this.isPastHoliday = false;
        this._showPastString = false;
    };

    @action setPastHoliday = (): void => {
        this.clearDates();
        this.contactInfo.onChangeField(ContactFormFields.DepartureAndReturnDate, this._pastString);
        this.closeDatePicker(false);
        this.isPastHoliday = true;
        this._showPastString = true;
    };

    _cloneCurrentValues = (): void => {
        this._savedDeparture = this.departure ? new Date(this.departure.getTime()) : null;
        this._savedArrival = this.arrival ? new Date(this.arrival.getTime()) : null;
        this._savedIsPastHoliday = this.isPastHoliday;
        this._savedShowPastString = this._showPastString;
    };

    _restoreFromClone = (): void => {
        this.setDates([
            this._savedDeparture ? new Date(this._savedDeparture.getTime()) : null,
            this._savedArrival ? new Date(this._savedArrival.getTime()) : null,
        ] as Date[]);
        this._showPastString = this._savedShowPastString;
    };

    @action setContactQueryType = (queryType: Nullable<ContactQueryType>): void => {
        this.contactQueryType = queryType;
        this.resetForm(queryType);
    };
}
