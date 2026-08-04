import { contactNumberValidation, EMAIL_PATTERN, IValidationConfig, VALID_FILE_TYPES } from 'code/validation.config';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';
import { ContactQueryType } from 'frontend/components/renderings/ContactUs/data/constants';

const baseValidationConfig: IValidationConfig = {
    question: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.ContactUsErrorsQuestionRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidTextareaLength,
            value: 2000,
            trigger: ValidationType.OnType,
        },
    ],
    leadPassengerFirstName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.ContactUsErrorsFirstNameIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.ContactUsErrorsFirstNameInvalidCharacters,
            value: /^[^0-9+=*/\\@#%^&_~|<>{}[\]()$€£¥¢₩±×÷∑√№∞…;:"“”,.?!—]{1,100}$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.ContactUsErrorsFirstNameExceededLength,
            value: 80,
            trigger: ValidationType.OnType,
        },
    ],
    leadPassengerLastName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.ContactUsErrorsSurnameIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.ContactUsErrorsSurnameInvalidCharacters,
            value: /^[^0-9+=*/\\@#%^&_~|<>{}[\]()$€£¥¢₩±×÷∑√№∞…;:"“”,.?!—]{1,100}$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.ContactUsErrorsSurnameExceededLength,
            value: 80,
            trigger: ValidationType.OnType,
        },
    ],
    emailAddress: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.ContactUsErrorsEmailIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.ContactUsErrorsEmailExceededLength,
            value: 80,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.ContactUsErrorsEmailInvalid,
            value: EMAIL_PATTERN,
            trigger: ValidationType.OnBlur,
        },
    ],
    contactNumber: [
        {
            type: ValidationRule.MaxLengthPhone,
            message: SitecoreDictionary.ContactUsErrorsPhoneExceededLength,
            value: contactNumberValidation,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.ContactUsErrorsPhoneInvalid,
            value: /^(?![ ])(?!.*[ ]{2})[0-9\ ]+$/,
            trigger: ValidationType.OnType,
        },
    ],
    attachments: [
        {
            type: ValidationRule.FileSize,
            value: 10485760,
            message: SitecoreDictionary.ContactUsErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.FileType,
            value: VALID_FILE_TYPES,
            message: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.FilesAmount,
            value: 5,
            message: SitecoreDictionary.ContactUsErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
    ],
};

export const buildContactValidationConfig = (
    contactQuery: ContactQueryType,
    isBookingNotRequired?: boolean,
): IValidationConfig => {
    if (contactQuery === ContactQueryType.PostBooking) {
        return {
            departureAndReturnDate: [
                {
                    type: ValidationRule.Required,
                    message: SitecoreDictionary.ContactUsErrorsDatesRequired,
                    trigger: ValidationType.OnBlur,
                },
            ],
            bookingReference: [
                ...(isBookingNotRequired
                    ? []
                    : [
                          {
                              type: ValidationRule.Required,
                              message: SitecoreDictionary.ContactUsErrorsBookingReferenceRequired,
                              trigger: ValidationType.OnBlur,
                          },
                          {
                              type: ValidationRule.MinLength,
                              message: SitecoreDictionary.ContactUsErrorsBookingReferenceInvalid,
                              value: 7,
                              trigger: ValidationType.OnBlur,
                          },
                      ]),
                {
                    type: ValidationRule.Pattern,
                    message: SitecoreDictionary.ContactUsErrorsBookingReferenceInvalid,
                    value: /^[0-9\/]*$/,
                    trigger: ValidationType.OnType,
                },
            ],
            about: [
                {
                    type: ValidationRule.Required,
                    message: SitecoreDictionary.ContactUsErrorsQuestionSubjectRequired,
                    trigger: ValidationType.OnBlur,
                },
            ],
            ...baseValidationConfig,
        };
    }

    return baseValidationConfig;
};
