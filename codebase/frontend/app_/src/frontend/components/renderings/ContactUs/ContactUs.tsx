import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { VALID_FILE_TYPES } from 'code/validation.config';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useReCaptcha from 'frontend/hooks/useReCaptcha';
import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { ContactFormFields, ContactInfo } from 'models/data/contactForm/ContactInfo';
import { IValidationError } from 'models/data/validation/IValidationError';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import Drawer from 'frontend/components/common/Drawer';
import PhonePrefix from 'frontend/components/common/PhonePrefix';
import RadioButton from 'frontend/components/common/RadioButton';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatableFileUploadField from 'frontend/components/common/ValidatableFileUploadField';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';
import ValidatableTextarea from 'frontend/components/common/ValidatableTextarea/ValidatableTextarea';
import CalendarWrapper from 'frontend/components/renderings/ContactUs/components/CalendarWrapper';
import { useContactUsStore, withContactUsStore } from 'frontend/components/renderings/ContactUs/store/createStore';

import ContactFormDatePicker from './components/ContactFormDatePicker';
import ContactFromFieldset from './components/ContactFormFieldset/ContactFromFieldset';
import CurrentlyOnHolidayPopUp from './components/CurrentlyOnHolidayPopUp/CurrentlyOnHolidayPopUp';
import FakeDatePicker from './components/FakeDatePicker/FakeDatePicker';
import SubmitMessagePopUp from './components/SubmitMessagePopUp';
import { ContactHaveBookingRadioOptions, ContactHolidayState, ContactQueryType } from './data/constants';
import { IContactUsFields } from './data/models';

import styles from './ContactForm.module.scss';

export interface IContactUsProps {
    fields: IContactUsFields;
}

export const ContactUs: React.FC<IContactUsProps> = ({ fields }) => {
    const {
        isDatePickerOpen,
        isPastHoliday,
        isFutureDates,
        contactInfo,
        formKey,
        forceErrors,
        isSubmitting,
        currentDates,
        currentlyOnHoliday,
        formSubmittedPopup,
        isShowSuccessMessage,
        dateOfHoliday,
        isRecaptchaEnabled,
        contactQueryType,
        initialize,
        toggleDatePicker,
        clearDates,
        clearStore,
        toggleForceErrors,
        submitContactForm,
        closeOnHolidayPopup,
        closeSubmitMessage,
        setContactQueryType,
    } = useContactUsStore();

    const isScreenMedium = useMoreThenMobileViewport();

    const { dialingCodesSelectOptions, getPhrase, getSetting } = useStore((stores: IHolidaysStores) => ({
        dialingCodesSelectOptions: stores.appCatalogStore.dialingCodesSelectOptions,

        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    useReCaptcha(true, isRecaptchaEnabled);

    const isPreBookingQueryEnabled = !!fields?.IsPreBookingQueryEnabled?.value;

    const [phoneState, setPhoneState] = useState({ phoneFocused: false, codeDigitsClass: '', phoneLabelClass: '' });
    const [isBooked, setIsBooked] = useState(true);

    const contactSelectOptions = useMemo(() => {
        const checkState = isPastHoliday ? ContactHolidayState.Past : ContactHolidayState.Future;

        return (fields?.QuestionList || [])
            .filter(option => option?.fields?.State?.value === checkState)
            .map(option => ({
                value: option.fields.Title.value,
                label: option.fields.Title.value,
            }));
    }, [isPastHoliday, fields]);

    const onChangeDialingCode = (value: string): void => {
        contactInfo.onChangeField(ContactFormFields.DialingCode, value);
        updateCodeDigitsClass();
    };

    const updateCodeDigitsClass = (): void => {
        if (contactInfo.contactNumber || !!phoneState.codeDigitsClass) {
            setPhoneState({
                phoneFocused: true,
                codeDigitsClass: `code-${contactInfo?.dialingCode?.length}-digits`,
                phoneLabelClass: phoneState.phoneLabelClass,
            });
        }
    };

    const onPhoneFocus = (): void => {
        setPhoneState({
            phoneFocused: true,
            codeDigitsClass: `code-${contactInfo?.dialingCode?.length}-digits`,
            phoneLabelClass: 'form-control__label--active',
        });
    };

    const onPhoneBlur = (): void => {
        if (contactInfo.contactNumber) {
            return;
        }

        setPhoneState({ phoneFocused: false, codeDigitsClass: '', phoneLabelClass: '' });
    };

    const phoneFilter = (): RegExp | undefined => {
        if (contactInfo.dialingCode === '44' || contactInfo.dialingCode === '353') {
            return /^(0){1}/g;
        }

        return undefined;
    };

    const phonePlaceholder = (): string => {
        const mobileNumberLabel = getPhrase(SitecoreDictionary.GuestDetailsLabelsPhone);

        if (phoneState.phoneFocused) {
            return `${mobileNumberLabel}`;
        }

        return `(+${contactInfo.dialingCode}) ${mobileNumberLabel}`;
    };

    const isFieldRequired = (field: ContactFormFields): boolean =>
        validationService.isFieldRequired(contactInfo, field as keyof ContactInfo);

    const onChangeField = (field: ContactFormFields, value: any): void => {
        contactInfo.onChangeField(field, value);
    };

    const validateField = (field: ContactFormFields): IValidationError[] => contactInfo.validateField(field);

    const scrollIntoErrors = async (): Promise<void> => {
        await toggleForceErrors(true);
        scrollToErrorBlock();
    };

    const onSubmitForm = async (event?: React.MouseEvent | React.FormEvent): Promise<void> => {
        event?.preventDefault();

        if (!contactQueryType) return;

        if (contactInfo.isValid) {
            try {
                await submitContactForm();
                setIsBooked(true);
                setPhoneState({ phoneFocused: false, codeDigitsClass: '', phoneLabelClass: '' });
            } catch (e) {
                scrollIntoErrors();
            }
        } else {
            scrollIntoErrors();
        }
    };

    useEffect(() => {
        initialize(isPreBookingQueryEnabled);

        return () => clearStore();
    }, []);

    const handleChangeIsBooked = (e: ChangeEvent<HTMLInputElement>): void => {
        setIsBooked(!e.target.checked);
        initialize(isPreBookingQueryEnabled, e.target.checked);
    };

    if (!fields || !getSetting(SiteSettings.IsFormEnabled)) {
        return null;
    }

    const {
        FormTitle,
        FormDescription,
        DepartureAndReturnDatesTitle,
        DepartureAndReturnDatesLabel,
        DepartureAndReturnDatesPlaceholder,
        BookingReferenceTitle,
        BookingReferencePlaceholder,
        BookingReferenceDescription,
        QuestionTitle,
        QuestionDescription,
        QuestionLabel,
        QuestionOptionsPlaceholder,
        DetailsTitle,
        DetailsFirstNamePlaceholder,
        DetailsLastNamePlaceholder,
        DetailsEmailPlaceholder,
        DetailsCodePlaceholder,
        DetailsContactNumberPlaceholder,
        ScreenshotTitle,
        ScreenshotDescription,
        OnHolidayTitle,
        OnHolidayDescription,
        OnHolidayButton,
        SuccessTitleWithCaseNumber,
        SuccessTextWithCaseNumber,
        SuccessTitle,
        SuccessText,
        FailedTitle,
        FailedText,
        DatePickerTitle,
        DatePickerText,
        DatePickerMonthLimit,
        HaveBookingTitle,
        PreBookingDetailsFirstNamePlaceholder,
        PreBookingDetailsLastNamePlaceholder,
        PreBookingDetailsEmailPlaceholder,
        NoBookingYetLabel,
        DepartureAndReturnDatesNoSelectionAriaLabel,
        DepartureAndReturnDatesSelectedAriaLabel,
    } = fields;

    const onHoliday = {
        OnHolidayTitle,
        OnHolidayDescription,
        OnHolidayButton,
    };

    const submitPopup = {
        SuccessTitleWithCaseNumber,
        SuccessTextWithCaseNumber,
        SuccessTitle,
        SuccessText,
        FailedTitle,
        FailedText,
    };

    const getPrefix = (): JSX.Element => <PhonePrefix code={`(+${contactInfo.dialingCode})`} />;

    const labels =
        contactQueryType === ContactQueryType.PreBooking
            ? {
                  [ContactFormFields.LeadPassengerFirstName]: PreBookingDetailsFirstNamePlaceholder,
                  [ContactFormFields.LeadPassengerLastName]: PreBookingDetailsLastNamePlaceholder,
                  [ContactFormFields.EmailAddress]: PreBookingDetailsEmailPlaceholder,
              }
            : {
                  [ContactFormFields.LeadPassengerFirstName]: DetailsFirstNamePlaceholder,
                  [ContactFormFields.LeadPassengerLastName]: DetailsLastNamePlaceholder,
                  [ContactFormFields.EmailAddress]: DetailsEmailPlaceholder,
              };

    return (
        <>
            <form key={formKey} onSubmit={onSubmitForm} className={styles.form} data-tid='contact-us'>
                {FormTitle?.value || FormDescription?.value ? (
                    <div className={styles.formIntro} data-tid='contact-intro'>
                        <div className={styles.formIntroContent}>
                            {FormTitle?.value && (
                                <Text
                                    field={FormTitle}
                                    className={styles.formTitle}
                                    tag='h2'
                                    data-tid='contact-title'
                                />
                            )}
                            <RichTextWithLinks field={FormDescription} dataId='contact-content' />
                        </div>
                    </div>
                ) : null}

                <div className={styles.fieldSets} data-tid='contact-fieldsets'>
                    <div className={styles.fieldSetsContent}>
                        {isPreBookingQueryEnabled && (
                            <ContactFromFieldset title={HaveBookingTitle} titleTid='contact-have-booking-label'>
                                {ContactHaveBookingRadioOptions.map(option => (
                                    <RadioButton
                                        name='booking-query'
                                        key={option.dataTid}
                                        dataTid={option.dataTid}
                                        label={getPhrase(option.label)}
                                        value={option.value}
                                        checked={contactQueryType === option.value}
                                        onChange={(): void => setContactQueryType(option.value)}
                                    />
                                ))}
                            </ContactFromFieldset>
                        )}

                        {contactQueryType === ContactQueryType.PostBooking && (
                            <ContactFromFieldset title={DepartureAndReturnDatesTitle} titleTid='contact-duration'>
                                <FakeDatePicker
                                    value={contactInfo.departureAndReturnDate}
                                    onClick={toggleDatePicker}
                                    label={DepartureAndReturnDatesLabel?.value}
                                    ariaExpanded={isDatePickerOpen}
                                    ariaLabelNoSelection={DepartureAndReturnDatesNoSelectionAriaLabel?.value}
                                    ariaLabelSelectedValue={DepartureAndReturnDatesSelectedAriaLabel?.value}
                                    id='booking-dates-picker'
                                />
                            </ContactFromFieldset>
                        )}

                        {contactQueryType === ContactQueryType.PostBooking && contactInfo.departureAndReturnDate && (
                            <ContactFromFieldset
                                title={BookingReferenceTitle}
                                titleTid={`contact-${ContactFormFields.BookingReference}-label`}
                            >
                                {!(isFutureDates && !isBooked) && (
                                    <ValidatableField
                                        id={ContactFormFields.BookingReference}
                                        label={BookingReferencePlaceholder?.value}
                                        value={contactInfo.bookingReference}
                                        onChange={(value): void =>
                                            onChangeField(ContactFormFields.BookingReference, value)
                                        }
                                        errors={validateField(ContactFormFields.BookingReference)}
                                        required={isFieldRequired(ContactFormFields.BookingReference)}
                                        forceError={forceErrors}
                                        note={
                                            <RichTextWithLinks
                                                className={styles.formNote}
                                                field={BookingReferenceDescription}
                                                dataId='contact-reference-note'
                                            />
                                        }
                                        isVertical
                                        shouldTrimOnBlur
                                    />
                                )}
                                {isFutureDates && (
                                    <Checkbox
                                        small
                                        tick
                                        textRight
                                        checked={!isBooked}
                                        label={NoBookingYetLabel}
                                        onChange={handleChangeIsBooked}
                                        dataTid='no-booking-yet'
                                    />
                                )}
                            </ContactFromFieldset>
                        )}

                        {(contactQueryType === ContactQueryType.PreBooking || contactInfo.departureAndReturnDate) && (
                            <>
                                <ContactFromFieldset
                                    title={QuestionTitle}
                                    titleTid={`contact-${ContactFormFields.About}-label`}
                                >
                                    <RichTextWithLinks
                                        className={styles.contactAboutNote}
                                        field={QuestionDescription}
                                        dataId={`contact-${ContactFormFields.About}-note`}
                                    />
                                    {contactQueryType === ContactQueryType.PostBooking && (
                                        <ValidatableSelectField
                                            id={ContactFormFields.About}
                                            label={QuestionOptionsPlaceholder?.value}
                                            options={contactSelectOptions}
                                            value={contactInfo.about}
                                            onChange={(value): void => onChangeField(ContactFormFields.About, value)}
                                            errors={validateField(ContactFormFields.About)}
                                            required={isFieldRequired(ContactFormFields.About)}
                                            fieldClass={styles.field}
                                            forceError={forceErrors}
                                            isVertical
                                        />
                                    )}
                                    <ValidatableTextarea
                                        id={ContactFormFields.Question}
                                        label={QuestionLabel?.value}
                                        value={contactInfo.question}
                                        errors={validateField(ContactFormFields.Question)}
                                        required={isFieldRequired(ContactFormFields.Question)}
                                        textareaClass={styles.formTextarea}
                                        maxCharacters={2000}
                                        forceError={forceErrors}
                                        isVertical
                                        onChange={(value): void =>
                                            onChangeField(ContactFormFields.Question, value.replace(/\s*\n/g, ' '))
                                        }
                                        onKeyDown={(e): void => {
                                            e.code === KeyboardKey.ENTER && e.preventDefault();
                                        }}
                                    />
                                </ContactFromFieldset>

                                <ContactFromFieldset title={DetailsTitle} titleTid='contact-passenger-details'>
                                    <ValidatableField
                                        id={ContactFormFields.LeadPassengerFirstName}
                                        label={labels[ContactFormFields.LeadPassengerFirstName]?.value}
                                        value={contactInfo.leadPassengerFirstName}
                                        onChange={(value): void =>
                                            onChangeField(ContactFormFields.LeadPassengerFirstName, value)
                                        }
                                        errors={validateField(ContactFormFields.LeadPassengerFirstName)}
                                        required={isFieldRequired(ContactFormFields.LeadPassengerFirstName)}
                                        forceError={forceErrors}
                                        isVertical
                                        shouldTrimOnBlur
                                        maxLength='80'
                                    />
                                    <ValidatableField
                                        id={ContactFormFields.LeadPassengerLastName}
                                        label={labels[ContactFormFields.LeadPassengerLastName]?.value}
                                        value={contactInfo.leadPassengerLastName}
                                        onChange={(value): void =>
                                            onChangeField(ContactFormFields.LeadPassengerLastName, value)
                                        }
                                        errors={validateField(ContactFormFields.LeadPassengerLastName)}
                                        required={isFieldRequired(ContactFormFields.LeadPassengerLastName)}
                                        forceError={forceErrors}
                                        isVertical
                                        shouldTrimOnBlur
                                        maxLength='80'
                                    />
                                    <ValidatableField
                                        id={ContactFormFields.EmailAddress}
                                        label={labels[ContactFormFields.EmailAddress]?.value}
                                        value={contactInfo.emailAddress}
                                        onChange={(value): void => onChangeField(ContactFormFields.EmailAddress, value)}
                                        errors={validateField(ContactFormFields.EmailAddress)}
                                        required={isFieldRequired(ContactFormFields.EmailAddress)}
                                        forceError={forceErrors}
                                        isVertical
                                        shouldTrimOnBlur
                                        maxLength='80'
                                    />

                                    <ValidatableSelectField
                                        id={ContactFormFields.DialingCode}
                                        label={DetailsCodePlaceholder?.value}
                                        onChange={onChangeDialingCode}
                                        value={contactInfo.dialingCode}
                                        options={dialingCodesSelectOptions}
                                        errors={validateField(ContactFormFields.DialingCode)}
                                        isVertical
                                        required={isFieldRequired(ContactFormFields.DialingCode)}
                                    />

                                    <ValidatableField
                                        id={ContactFormFields.ContactNumber}
                                        watermark={phonePlaceholder()}
                                        onChange={(value): void =>
                                            onChangeField(ContactFormFields.ContactNumber, value)
                                        }
                                        Prefix={getPrefix}
                                        label={DetailsContactNumberPlaceholder?.value}
                                        labelClass={phoneState.phoneLabelClass}
                                        value={contactInfo.contactNumber}
                                        errors={validateField(ContactFormFields.ContactNumber)}
                                        inputContainerClass={`form-control__phone-label ${phoneState.codeDigitsClass}`}
                                        containerClass={styles.noMarginBottom}
                                        required={isFieldRequired(ContactFormFields.ContactNumber)}
                                        blurFilter={phoneFilter()}
                                        onBlur={onPhoneBlur}
                                        onFocus={onPhoneFocus}
                                        isVertical
                                        shouldTrimOnBlur
                                        note={
                                            <p className={classNames(styles.optional)}>
                                                {getPhrase(SitecoreDictionary.GlobalsLabelsOptional)}
                                            </p>
                                        }
                                    />
                                </ContactFromFieldset>

                                <ContactFromFieldset
                                    title={ScreenshotTitle}
                                    titleTid='contact-attachments'
                                    className={styles.uploadForm}
                                >
                                    <RichTextWithLinks
                                        className={styles.contactAboutNote}
                                        field={ScreenshotDescription}
                                    />
                                    <ValidatableFileUploadField
                                        files={contactInfo.attachments}
                                        onChange={(files): void => onChangeField(ContactFormFields.Attachments, files)}
                                        label={getPhrase(SitecoreDictionary.GlobalsSubmitFile)}
                                        errors={validateField(ContactFormFields.Attachments)}
                                        acceptFileTypes={VALID_FILE_TYPES}
                                        id={ContactFormFields.Attachments}
                                        allowedUploadedFileNumb={5}
                                        required={isFieldRequired(ContactFormFields.Attachments)}
                                        multiple
                                        forceError={forceErrors}
                                    />
                                </ContactFromFieldset>

                                <div className={styles.buttonContainer}>
                                    <Button
                                        onClick={onSubmitForm}
                                        hasDisabledStyles={!contactInfo.isValid}
                                        isLoading={isSubmitting}
                                        isFullWidth
                                        isMedium
                                        type='submit'
                                        dataTid='sumbit-btn'
                                    >
                                        {getPhrase(SitecoreDictionary.GlobalsSubmitRequest)}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {!isScreenMedium && isDatePickerOpen && (
                    <div
                        className={classNames(styles.drawer, 'sbv3', 'search-bar-box', 'search-bar')}
                        data-tid='date-picker-drawer'
                    >
                        <Drawer open={isDatePickerOpen}>
                            <div className={classNames(styles.mobileDatePicker, 'search-bar__mobile-box')}>
                                <div
                                    className={classNames('search-bar__dd-wr', 'search-bar__dd-wr--when', {
                                        [styles.nothingSelected]: currentDates.length === 0,
                                    })}
                                >
                                    <CalendarWrapper monthLimit={DatePickerMonthLimit.value} />
                                </div>
                            </div>
                        </Drawer>
                    </div>
                )}
            </form>

            {currentlyOnHoliday && (
                <CurrentlyOnHolidayPopUp closeOnHolidayPopup={closeOnHolidayPopup} onHolidayContent={onHoliday} />
            )}
            {formSubmittedPopup && (
                <SubmitMessagePopUp
                    closeSubmitMessage={closeSubmitMessage}
                    isSuccess={isShowSuccessMessage}
                    submitPopupContent={submitPopup}
                />
            )}

            {isScreenMedium && isDatePickerOpen && (
                <ContactFormDatePicker
                    dateOfHoliday={dateOfHoliday}
                    toggle={toggleDatePicker}
                    clearDates={clearDates}
                    placeholder={DepartureAndReturnDatesPlaceholder?.value}
                    title={DatePickerTitle}
                    text={DatePickerText}
                    monthLimit={DatePickerMonthLimit.value}
                />
            )}
        </>
    );
};

export default withContactUsStore(observer(ContactUs));
