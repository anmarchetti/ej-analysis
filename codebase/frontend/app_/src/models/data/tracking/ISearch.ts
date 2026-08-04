import { CurrencyCode } from 'code/currency';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IGuestAllocation } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';

export interface ISearchDependenciesData {
    currencyCode: CurrencyCode;
    filteredDestinations: Nullable<IDestination[]>;
    flexDays: number;
    from: Date | null;
    isFlexible: boolean;
    origins: string[];
    originsWithNames: IDestinationCountry[];
    page: number;
    roomsAllocation: (RoomAllocation | IGuestAllocation)[];
    roomsAllocationLength: number;
    selectedDestinations: IDestination[];
    take: number;
    to: Date | null;
}
