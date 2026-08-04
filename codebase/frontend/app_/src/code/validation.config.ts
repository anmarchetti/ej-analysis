import { CardInfo } from 'models/data/payment/CardInfo';
import { TValidationRules } from 'models/data/validation/IValidationRules';
import { CardType } from 'models/enum/CardType';
import { AdultTitles } from 'models/enum/CustomerTitles';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ValidationType } from 'models/enum/ValidationType';

import { DATE_FORMATS } from './dates';
import { Tokens } from './tokens';

export const ONE_MB = 1048576; // 1mb
export const SCREENSHOT_FILE_TYPES = [FileType.Jpeg, FileType.Png];
export const VALID_FILE_TYPES = [FileType.Jpeg, FileType.Png, FileType.Gif, FileType.Bmp, FileType.Pdf, FileType.Html];
export const EMAIL_MAX_LENGTH = 256;
export const EMAIL_PATTERN =
    /^([a-zA-Z0-9_+\-\.\']+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,12}|[0-9]{1,12})(\]?)$/;
export const PROMOCODE_INVALID_CHARS = new RegExp(
    `'.\`!@$%^()=+[]{}|;:',<>?/*`
        .split('')
        .map(s => '\\' + s)
        .join('|'),
);
export const contactNumberValidation = (target: AnyObject): number => {
    /**The max length of UK number is 10, Ireland - 9
     * The max length of other phone number with dialingCode is 15
     */
    const dialingCode = target?.dialingCode;
    const phone = target?.phone || target?.mobilePhone;

    if (phone && (dialingCode === '44' || dialingCode === '353')) {
        if (phone[0] === '0') {
            return 13 - dialingCode.length;
        }

        return 12 - dialingCode.length;
    }

    return 15 - dialingCode?.length || 0;
};

export interface IValidationConfig {
    [key: string]: TValidationRules[];
}

export const ValidationConfig: IValidationConfig = {
    title: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTitleIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTitleIsRequired,
            value: new RegExp(`^(${AdultTitles.map(item => item.value).join('|')})$`, 'i'),
            trigger: ValidationType.OnBlur,
        },
    ],
    dialingCode: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesInternationalDialingCodeRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    countryCode: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesCountryRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    fullName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFullNameIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFullNameExceededLength,
            value: 61, // firstname max length + lastname max length +1 symbol for spase between first and last name
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFullNameInvalidCharacters,
            value: /^[^0-9+;:""`|!?<>().,/\\@#$£%^&*_]{1,61}$/,
            trigger: ValidationType.OnType,
        },
    ],
    firstName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFirstNameIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFirstNameExceededLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesFirstNameInvalidCharacters,
            value: /^[^0-9+;:""`|!?<>().,/\\@#$£%^&*_]{1,30}$/,
            trigger: ValidationType.OnType,
        },
    ],
    lastName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesSurnameIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesSurnameExceededLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesSurnameInvalidCharacters,
            value: /^[^0-9+;:""`|!?<>().,/\\@#$£%^&*_]{1,30}$/,
            trigger: ValidationType.OnType,
        },
    ],
    address: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressExceededLength,
            value: 32,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressInvalidCharacters,
            value: /^[^;:""`|!?<>\\@$£%^*\]\[]{1,32}$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressInsufficientLength,
            value: 4,
            trigger: ValidationType.OnBlur,
        },
    ],
    address2: [
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressExceededLength,
            value: 32,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressInvalidCharacters,
            value: /^[^;:""`|!?<>\\@$£%^*\]\[]{1,32}$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesAddressInsufficientLength,
            value: 4,
            trigger: ValidationType.OnBlur,
        },
    ],
    city: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTownCityIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTownCityMinimumLength,
            value: 2,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTownCityExceededLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesTownCityInvalidCharacters,
            value: /^([^;:""`|!?<>\\@$£%^*\]\[]{1,30})$/,
            trigger: ValidationType.OnType,
        },
    ],
    postCode: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPostcodeIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPostcodeMinimumLength,
            value: 2,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPostcodeMaximumLength,
            value: 8,
            trigger: ValidationType.OnType,
        },
    ],
    email: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesEmailIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesEmailExceededLength,
            value: EMAIL_MAX_LENGTH,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesEmailInvalid,
            value: EMAIL_PATTERN,
            trigger: ValidationType.OnBlur,
        },
    ],
    password: [
        {
            type: ValidationRule.Required,
            strict: false,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPasswordIsRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    createPassword: [
        {
            type: ValidationRule.Required,
            strict: false,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPasswordIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaLength,
            trigger: ValidationType.OnBlur,
            value: 10,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaLength,
            trigger: ValidationType.OnType,
            value: 20,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaLowercaseLetter,
            trigger: ValidationType.OnBlur,
            value: /^(?=.*[a-z]).+$/,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaUppercaseLetter,
            trigger: ValidationType.OnBlur,
            value: /^(?=.*[A-Z]).+$/,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaNumber,
            trigger: ValidationType.OnBlur,
            value: /^(?=.*[0-9]).+$/,
        },
        {
            type: ValidationRule.ReversePattern,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaSpecialCharacters,
            value: /\=|\#|\&|\+|\s/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.CreateAccountPasswordCriteriaFirstCharacter,
            value: /^(?!(0)).+$/,
            trigger: ValidationType.OnType,
        },
    ],
    phone: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPhoneIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPhoneInvalid,
            value: 3,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLengthPhone,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPhoneExceededLength,
            value: contactNumberValidation,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPhoneInvalid,
            value: /^(?![ ])(?!.*[ ]{2})[0-9\ ]+$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GuestDetailsErrorMessagesPhoneInvalid,
            value: (target: AnyObject) =>
                target?.dialingCode === '44'
                    ? /^(07[0-9 ]*|7[0-9 ]*|0)$/ // UK: must start with 07 or 7
                    : /^[\s\S]*$/, // non-UK: no mobile restriction, always passes
            trigger: ValidationType.OnType,
        },
    ],
    departureDate: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.LoginErrorMessagesDepartureDateIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Date,
            message: SitecoreDictionary.LoginErrorMessagesDepartureDateIsInvalid,
            trigger: ValidationType.OnBlur,
            replacedToken: Tokens.Date,
            replacedValue: DATE_FORMATS.inputField,
        },
    ],
    bookingReference: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.LoginErrorMessagesReferenceIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.LoginErrorMessagesReferenceIsInvalid,
            value: /^[0-9\/]*$/,
            trigger: ValidationType.OnType,
        },
    ],
    dateOfBirth: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GuestDetailsErrorMessagesDOBIsRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GuestDetailsErrorMessagesDOBExceededLength,
            value: 10,
            trigger: ValidationType.OnType,
            replacedToken: Tokens.Date,
            replacedValue: DATE_FORMATS.inputField,
        },
        {
            type: ValidationRule.Date,
            message: SitecoreDictionary.GuestDetailsErrorMessagesDOBInvalid,
            trigger: ValidationType.OnBlur,
            replacedToken: Tokens.Date,
            replacedValue: DATE_FORMATS.inputField,
        },
    ],
    /** Payment card validation */
    cardName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesNameOnCard,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesNameOnCard,
            value: /^(?:(?!([0-9!@*#$%^()_=[\]{}|:";<>?])).)*$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.PaymentErrorMessagesNameOnCard,
            trigger: ValidationType.OnType,
            value: 40,
        },
    ],
    cardNumber: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesCardNumber,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.PaymentMethod,
            message: SitecoreDictionary.PaymentErrorMessagesCardType,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesCardNumber,
            trigger: ValidationType.OnType,
            value: /^[0-9 ]+$/i,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesCardNumber,
            trigger: ValidationType.OnBlur,
            value: (target: CardInfo) =>
                target.cardType === CardType.AmericanExpress
                    ? /^\d{4}[ |\-]?\d{6}[ |\-]?\d{5}$/i
                    : /^\d{4}[ |\-]?\d{4}[ |\-]?\d{4}[ |\-]?\d{4}$/i,
        },
        {
            type: ValidationRule.ConstLength,
            message: SitecoreDictionary.PaymentErrorMessagesCardNumber,
            trigger: ValidationType.OnBlur,
            value: (target: CardInfo) => (target.cardType === CardType.AmericanExpress ? 15 : 16),
        },
        {
            type: ValidationRule.CardNumber,
            message: SitecoreDictionary.PaymentErrorMessagesCardNumber,
            trigger: ValidationType.OnBlur,
        },
    ],
    expiryDate: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesExpiryDate,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.ExpiryDate,
            message: SitecoreDictionary.PaymentErrorMessagesExpiryDate,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesExpiryDate,
            trigger: ValidationType.OnType,
            value: /^\d|\/|\.+$/i,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesExpiryDate,
            trigger: ValidationType.OnBlur,
            value: /^\d{0,2}[\/|\.]\d{0,2}$/i,
        },
    ],
    issueNumber: [
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesIssueNumber,
            trigger: ValidationType.OnType,
            value: /^[0-9]+$/i,
        },
    ],
    cvvNumber: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesCvvNumber,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MinLength,
            message: SitecoreDictionary.PaymentErrorMessagesCvvNumber,
            trigger: ValidationType.OnBlur,
            value: (target: CardInfo) =>
                target.cardType === CardType.AmericanExpress || target.cardType === CardType.InvalidType ? 4 : 3,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PaymentErrorMessagesCvvNumber,
            trigger: ValidationType.OnType,
            value: /^[0-9]+$/i,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.PaymentErrorMessagesCvvNumber,
            trigger: ValidationType.OnType,
            value: (target: CardInfo) =>
                target.cardType === CardType.AmericanExpress || target.cardType === CardType.InvalidType ? 4 : 3,
        },
    ],
    required: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    paymentAmount: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PaymentErrorMessagesRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxValue,
            message: SitecoreDictionary.PaymentErrorMessagesPaymentAmount,
            value: (target: any) => target.props.fullAmount - (target.props.residualBalance ?? 0.01),
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MinValue,
            message: SitecoreDictionary.PaymentErrorMessagesValidAmount,
            value: (target: any) => target.props.minPaymentAmount ?? 0,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            strict: true,
            message: SitecoreDictionary.PaymentErrorMessagesValidAmount,
            value: /^\$?\d+(\.\d{0,2})?$/,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.ReversePattern,
            message: SitecoreDictionary.PaymentErrorMessagesValidAmount,
            value: /^[0-9]+\.$/,
            trigger: ValidationType.OnBlur,
        },
    ],
};

export const PricePromiseValidationConfig: IValidationConfig = {
    name: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsNameRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PricePromiseErrorsNameInvalid,
            value: /^[^0-9+;:""`|!?<>().,/\\@#$£%^&*]{1,30}$/,
            trigger: ValidationType.OnType,
        },
    ],
    bookingReference: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsBookingReferenceRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.PricePromiseErrorsBookingReferenceInvalid,
            value: /^[0-9\/]*$/,
            trigger: ValidationType.OnType,
        },
    ],
    departureDate: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsDepartureDateRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Date,
            message: SitecoreDictionary.PricePromiseErrorsDepartureDateInvalid,
            trigger: ValidationType.OnBlur,
            replacedToken: Tokens.Date,
            replacedValue: DATE_FORMATS.inputField,
        },
    ],
    link: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsLinkRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            strict: true,
            message: SitecoreDictionary.PricePromiseErrorsLinkInvalidURL,
            value: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/,
            trigger: ValidationType.OnType,
        },
    ],
    sameDatesOfTravel: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    sameFlights: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    samePartyComposition: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    sameRoomType: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    inclusiveOn23kg: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    differentCompany: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    bookedWithinLast24h: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
    screenshots: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.PricePromiseErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.FileSize,
            value: 10485760,
            message: SitecoreDictionary.PricePromiseErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.FileType,
            value: [FileType.Jpeg, FileType.Png],
            message: SitecoreDictionary.PricePromiseErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.FilesAmount,
            value: 5,
            message: SitecoreDictionary.PricePromiseErrorsScreenshotInvalid,
            trigger: ValidationType.OnBlur,
        },
    ],
};

export const FeedbackFormValidationConfig: IValidationConfig = {
    Name: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesNameFieldRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInName,
            value: /^[a-zA-Z\ \-\']+$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidNameLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
    ],
    TradeAgentName: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesTravelAgentFieldRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInTravelAgent,
            value: /^[a-zA-Z\ \-\']+$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidTravelAgentLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
    ],
    ABTANumber: [
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInABTANumber,
            value: /^[0-9 ]+$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidABTANumberLength,
            value: 15,
            trigger: ValidationType.OnType,
        },
    ],
    Email: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesEmailFieldRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidEmailLength,
            value: EMAIL_MAX_LENGTH,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInEmail,
            value: EMAIL_PATTERN,
            trigger: ValidationType.OnBlur,
        },
    ],
    FeedbackText: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesFeedbackFieldRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidTextareaLength,
            value: 2500,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInTextarea,
            value: /^[a-zA-Z0-9\s,-.]*$/i,
            trigger: ValidationType.OnType,
        },
    ],
    IsFeedbackTypeValid: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesFeedbackTypeFieldRequired,
            trigger: ValidationType.OnBlur,
        },
    ],
};

type TGetFeedbackDocsProps = {
    fileErrorLabel: string;
    fileTypes: FileType[];
    maxFileCount: number;
    maxFileSize: number;
};

export const getFeedbackDocsValidationConfig = ({
    maxFileSize,
    fileTypes,
    fileErrorLabel,
    maxFileCount,
}: TGetFeedbackDocsProps): TValidationRules[] => [
    {
        type: ValidationRule.FileSize,
        value: maxFileSize,
        message: fileErrorLabel,
        trigger: ValidationType.OnBlur,
    },
    {
        type: ValidationRule.FileType,
        value: fileTypes,
        message: fileErrorLabel,
        trigger: ValidationType.OnBlur,
    },
    {
        type: ValidationRule.FilesAmount,
        value: maxFileCount,
        message: fileErrorLabel,
        trigger: ValidationType.OnBlur,
    },
];

export const FindBookingValidationConfig: IValidationConfig = {
    bookingReference: [
        {
            type: ValidationRule.Required,
            message: SitecoreDictionary.GlobalsErrorMessagesBookingReferenceRequired,
            trigger: ValidationType.OnBlur,
        },
        {
            type: ValidationRule.Pattern,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidCharactersInBookingReference,
            value: /^[a-zA-Z0-9\s,-.]*$/i,
            trigger: ValidationType.OnType,
        },
        {
            type: ValidationRule.MaxLength,
            message: SitecoreDictionary.GlobalsErrorMessagesInvalidBookingReferenceLength,
            value: 30,
            trigger: ValidationType.OnType,
        },
    ],
};

export const buildCreatePasswordValidationRules = (prohibitedWords: string[] = []): TValidationRules[] => {
    if (!prohibitedWords.length) return ValidationConfig.createPassword;

    const prohibitedWordsRule = {
        type: ValidationRule.ProhibitedWords,
        message: SitecoreDictionary.CreateAccountPasswordCriteriaProhibitedWords,
        value: prohibitedWords,
        trigger: ValidationType.OnType,
    };

    return [...ValidationConfig.createPassword, prohibitedWordsRule];
};
