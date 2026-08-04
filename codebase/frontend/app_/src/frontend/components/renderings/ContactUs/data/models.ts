import { ISitecoreCompositeField, ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import { ContactHolidayState } from './constants';

export interface IContactUsFields {
    BookingReferenceDescription: ISitecoreField<string>;
    BookingReferencePlaceholder: ISitecoreField<string>;
    BookingReferenceTitle: ISitecoreField<string>;
    DatePickerMonthLimit: ISitecoreField<number>;
    DatePickerText: ISitecoreField<string>;
    DatePickerTitle: ISitecoreField<string>;
    DepartureAndReturnDatesLabel: ISitecoreField<string>;
    DepartureAndReturnDatesNoSelectionAriaLabel: ISitecoreField<string>;
    DepartureAndReturnDatesPlaceholder: ISitecoreField<string>;
    DepartureAndReturnDatesSelectedAriaLabel: ISitecoreField<string>;
    DepartureAndReturnDatesTitle: ISitecoreField<string>;
    DetailsCodePlaceholder: ISitecoreField<string>;
    DetailsContactNumberPlaceholder: ISitecoreField<string>;
    DetailsEmailPlaceholder: ISitecoreField<string>;
    DetailsFirstNamePlaceholder: ISitecoreField<string>;
    DetailsLastNamePlaceholder: ISitecoreField<string>;
    DetailsTitle: ISitecoreField<string>;
    FailedText: ISitecoreField<string>;
    FailedTitle: ISitecoreField<string>;
    FormDescription: ISitecoreField<string>;
    FormTitle: ISitecoreField<string>;
    HaveBookingTitle: ISitecoreField<string>;
    // Additional fields for Pre Booking Queries
    IsPreBookingQueryEnabled: ISitecoreField<boolean>;
    NoBookingYetLabel: ISitecoreField<string>;
    OnHolidayButton: ISitecoreField<ISitecoreLink>;
    OnHolidayDescription: ISitecoreField<string>;
    OnHolidayTitle: ISitecoreField<string>;
    PreBookingDetailsEmailPlaceholder: ISitecoreField<string>;
    PreBookingDetailsFirstNamePlaceholder: ISitecoreField<string>;
    PreBookingDetailsLastNamePlaceholder: ISitecoreField<string>;
    QuestionDescription: ISitecoreField<string>;
    QuestionLabel: ISitecoreField<string>;
    QuestionList: ISitecoreCompositeField<{
        State: ISitecoreField<ContactHolidayState>;
        Title: ISitecoreField<string>;
    }>[];
    QuestionOptionsPlaceholder: ISitecoreField<string>;
    QuestionTitle: ISitecoreField<string>;
    ScreenshotDescription: ISitecoreField<string>;

    ScreenshotTitle: ISitecoreField<string>;
    SuccessText: ISitecoreField<string>;
    SuccessTextWithCaseNumber: ISitecoreField<string>;
    SuccessTitle: ISitecoreField<string>;
    SuccessTitleWithCaseNumber: ISitecoreField<string>;
}
