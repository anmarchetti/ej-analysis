import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { GuestType } from 'models/enum/GuestType';
import { IGuestPageFields } from 'frontend/components/renderings/GuestDetails/GuestDetails.utils';

export const mockGuests: IGuestPassenger[] = [
    {
        index: '1',
        age: 19,
        firstName: 'Ann',
        isLead: false,
        lastName: 'Brown',
        notBornYet: false,
        sex: 'SEX_FEMALE',
        title: 'Mrs',
        type: GuestType.Adult,
    },
    {
        index: '2',
        age: 10,
        firstName: 'Ann',
        isLead: true,
        lastName: 'Brown',
        notBornYet: false,
        sex: 'SEX_FEMALE',
        title: 'Mrs',
        type: GuestType.Adult,
    },
    {
        index: '3',
        age: 1,
        firstName: 'Ann',
        isLead: true,
        lastName: 'Brown',
        notBornYet: false,
        sex: 'SEX_FEMALE',
        title: 'Mrs',
        type: GuestType.Infant,
    },
];

export const guestsAmountByTypeMock = {
    adults: 2,
    children: 1,
    infants: 1,
};

export const mockGuestPageFields: IGuestPageFields = {
    CheckboxLabel: { value: 'CheckboxLabel' },
    GuestInformationDescription: { value: 'GuestInformationDescription' },
    GuestInformationTitle: { value: 'GuestInformationTitle' },
    HasSignInPrompt: { value: true },
    HidePageTitle: { value: false },
    ImportantInformation: { value: 'ImportantInformation' },
    RemoveAllLabel: { value: 'RemoveAllLabel' },
    SurnameTooltip: { value: 'SurnameTooltip' },
    BlacklistedEmails: { value: 'test@example.com' },
    BlacklistedDomains: { value: 'example.com' },
    OffersSectionDescription1: { value: 'OffersSectionDescription1' },
    OffersSectionDescription2: { value: 'OffersSectionDescription2' },
    OffersSectionTitle: { value: 'OffersSectionTitle' },
    POffersSectionDescription1: { value: 'POffersSectionDescription1' },
    POffersSectionDescription2: { value: 'POffersSectionDescription2' },
    PartnerOffersSectionTitle: { value: 'PartnerOffersSectionTitle' },
};
