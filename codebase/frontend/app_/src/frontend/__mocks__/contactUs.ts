import { mockSitecoreCompositeField, mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ContactHolidayState } from 'frontend/components/renderings/ContactUs/data/constants';
import { IContactUsFields } from 'frontend/components/renderings/ContactUs/data/models';

export const mockContactUsFields: IContactUsFields = {
    DepartureAndReturnDatesNoSelectionAriaLabel: mockSitecoreField('No departure and arrival dates selected'),
    DepartureAndReturnDatesSelectedAriaLabel: mockSitecoreField('Selected departure and arrival dates: ${value}.'),
    BookingReferenceDescription: mockSitecoreField('Booking Reference'),
    DepartureAndReturnDatesTitle: mockSitecoreField('Departure and return dates'),
    DetailsEmailPlaceholder: mockSitecoreField('Email address used when booking'),
    DetailsTitle: mockSitecoreField('Your details'),
    QuestionOptionsPlaceholder: mockSitecoreField('Choose question'),
    ScreenshotTitle: mockSitecoreField('Screenshots of the holiday'),
    BookingReferencePlaceholder: mockSitecoreField('Holidays booking reference'),
    DepartureAndReturnDatesLabel: mockSitecoreField('Departure date and return date'),
    DetailsCodePlaceholder: mockSitecoreField('Code'),
    DetailsFirstNamePlaceholder: mockSitecoreField(`Lead passenger's first name`),
    BookingReferenceTitle: mockSitecoreField('2. Booking reference'),
    DepartureAndReturnDatesPlaceholder: mockSitecoreField('Departure date and return date'),
    DetailsContactNumberPlaceholder: mockSitecoreField('Contact number'),
    DetailsLastNamePlaceholder: mockSitecoreField(`Lead passenger's last name`),
    QuestionLabel: mockSitecoreField('Your Question'),
    QuestionTitle: mockSitecoreField('3. Your question'),
    QuestionDescription: mockSitecoreField(
        'Please select the main reason for contacting us. You can provide additional information on anything else you’d like to mention in the textbox below.',
    ),
    ScreenshotDescription: mockSitecoreField('Screenshot Description'),
    FormTitle: mockSitecoreField('Tell us more about your booking'),
    FormDescription: mockSitecoreField('Form Description'),
    OnHolidayTitle: mockSitecoreField(`It looks like you're currently on holiday`),
    OnHolidayDescription: mockSitecoreField('Is this correct?'),
    OnHolidayButton: mockSitecoreField({
        href: '/en/holidays/',
        text: 'On Holiday',
        linktype: SitecoreLinkType.Internal,
    }),
    SuccessTitle: mockSitecoreField('You successfully submit the form'),
    SuccessText: mockSitecoreField('We will contact you soon about your request.'),
    FailedTitle: mockSitecoreField('Sorry, there has been a problem'),
    FailedText: mockSitecoreField('It looks like we ran into an problem submitting your form.'),
    DatePickerTitle: mockSitecoreField('Departure and return dates of your holiday'),
    DatePickerText: mockSitecoreField('Please provide the start and end date of your holiday.'),
    QuestionList: [
        mockSitecoreCompositeField('QuestionList1', {
            State: { value: ContactHolidayState.Future },
            Title: { value: 'Amend booking' },
        }),
        mockSitecoreCompositeField('QuestionList2', {
            State: { value: ContactHolidayState.Past },
            Title: { value: 'Make a claim' },
        }),
    ],
    IsPreBookingQueryEnabled: mockSitecoreField(false),
    HaveBookingTitle: mockSitecoreField('Do you have a booking?'),
    PreBookingDetailsFirstNamePlaceholder: mockSitecoreField('First name'),
    PreBookingDetailsLastNamePlaceholder: mockSitecoreField('Last name'),
    PreBookingDetailsEmailPlaceholder: mockSitecoreField('Email address'),
    DatePickerMonthLimit: mockSitecoreField(1),
    NoBookingYetLabel: mockSitecoreField('NoBookingYetLabel'),
    SuccessTextWithCaseNumber: mockSitecoreField('SuccessTextWithCaseNumber'),
    SuccessTitleWithCaseNumber: mockSitecoreField('SuccessTitleWithCaseNumber'),
};
