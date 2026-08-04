import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

export const mockFields = {
    // Header
    Name: mockSitecoreField('Group Booking'),
    Title: mockSitecoreField('Make Group Booking'),
    Image: mockSitecoreField(mockSitecoreImageField('/-/jssmedia/e3c5f4a5267e4d3ab9d95a7e5f447219.ashx')),

    // Form
    FormTitle: mockSitecoreField('Tell us more about a booking you want to make'),
    FormDescription: mockSitecoreField(
        '<p>Group Quote Form suggests helping to search holidays for at least 9 people including children and infants. Please specify the details below</p>',
    ),
    AgentInfoTitle: mockSitecoreField('1. Agent information'),
    AgentNamePlaceholder: mockSitecoreField('Agent name'),
    AgentEmailPlaceholder: mockSitecoreField('Agent email address'),
    AgentNumberPlaceholder: mockSitecoreField('ABTA or agent number'),
    SubmitCTAText: mockSitecoreField('Submit your request'),
    CustomersInfoTitle: mockSitecoreField('1. Agent information'),
    NumberOfRoomsLabel: mockSitecoreField('Room 1'),
    CustomersInfoDescription: mockSitecoreField(
        'Please select at least 9 people including children and infants in total.',
    ),
    CustomersInfoTotal: mockSitecoreField('The total amount of passengers'),
    TotalCountErrorTitle: mockSitecoreField('Error message'),
    TotalCountErrorDescription: mockSitecoreField(
        'You’re not able to book less than 9 pax via the Group booking form. You can book less than 9 pax via the website, if you have any issues contact the Trade support team.',
    ),
    IsFlexibleLabel: mockSitecoreField('Is Flexible Label'),
    IsFlexibleTooltipContent: mockSitecoreField('Is Flexible Tooltip Content'),
    DepartureDateLabel: mockSitecoreField('Departure Date Label'),
    DurationOfHolidayLabel: mockSitecoreField('Duration Of Holiday Label'),
    DurationOfHolidayNote: mockSitecoreField('Duration Of Holiday Note'),
    DestinationLabel: mockSitecoreField('Destination Label'),
    DestinationNote: mockSitecoreField('Destination Note'),
    AdditionalDetailsLabel: mockSitecoreField('Additional Details Label'),
    AdditionalDetailsPlaceholder: mockSitecoreField('Additional Details Placeholder'),
    DepartureAirportLabel: mockSitecoreField('Departure Airport Label'),
    DepartureAirportsList: [
        { fields: { Code: { value: 'airport1' }, Name: { value: 'airport1' } } },
        { fields: { Code: { value: 'airport2' }, Name: { value: 'airport2' } } },
        { fields: { Code: { value: 'airport3' }, Name: { value: 'airport3' } } },
    ] as any,
    BoardsLabel: mockSitecoreField('Boards Label'),
    BoardsNote: mockSitecoreField('Boards Note'),
    BoardsList: [
        { fields: { Value: { value: 'board1' } } },
        { fields: { Value: { value: 'board2' } } },
        { fields: { Value: { value: 'board3' } } },
    ] as any,

    // Form Errors
    AgentNameRequiredError: mockSitecoreField('Please provide agent name'),
    AgentEmailRequiredError: mockSitecoreField('Please provide agent email address'),
    ABTAorAgentNumRequiredError: mockSitecoreField('Please provide ABTA or agent number'),
    GeneralInvalidError: mockSitecoreField('Invalid character'),
    GeneralLimitError: mockSitecoreField('Maximum length exceeded'),
    DepartureDateError: mockSitecoreField('Departure Date Error'),
    DurationOfHolidayError: mockSitecoreField('Duration Of Holiday Error'),
    DestinationError: mockSitecoreField('Destination Error'),
    DepartureAirportError: mockSitecoreField('Departure Airport Error'),
    BoardsError: mockSitecoreField('Boards Error'),

    // Success Window
    SuccessTitle: mockSitecoreField('Group booking request submitted'),
    SuccessDescription: mockSitecoreField(
        '<p>The Group booking request submitted has been successful. <br /> We will send an email to the designated email address.</p>',
    ),
    BackToHomeCTAText: mockSitecoreField('Back to Trade Portal home'),
};
