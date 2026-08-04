import { mockSitecoreField } from 'frontend/utils/tests.utils';

export const mockExportDetailsFields = {
    LuggageInfoTitle: mockSitecoreField<string>('Luggage Info Title'),
    PramName: mockSitecoreField<string>('Pram Name'),
    SportEquipmentsLabel: mockSitecoreField<string>('Sport Equipments Label'),
    YourHolidayQuoteLabel: mockSitecoreField<string>('Your Holiday Quote Label'),
    SeatsSelectedLabel: mockSitecoreField<string>('{number} seats selected'),
    GuestsLabel: mockSitecoreField<string>('Guests Label'),
    BoardLabel: mockSitecoreField<string>('Board Label'),
};
