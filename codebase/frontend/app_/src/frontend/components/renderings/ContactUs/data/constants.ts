import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export enum ContactHolidayState {
    Past = 'Past',
    Future = 'Future',
}

export enum ContactQueryType {
    PostBooking = 'PostBooking',
    PreBooking = 'PreBooking',
}

// Radio Button Options to select if the user has a booking or not
export const ContactHaveBookingRadioOptions = [
    {
        value: ContactQueryType.PostBooking,
        dataTid: 'yes-option',
        label: SitecoreDictionary.GlobalsFormFieldsRadioButtonsYes,
    },
    {
        value: ContactQueryType.PreBooking,
        dataTid: 'no-option',
        label: SitecoreDictionary.GlobalsFormFieldsRadioButtonsNo,
    },
] as const;
