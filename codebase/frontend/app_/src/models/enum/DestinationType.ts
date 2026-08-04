import SitecoreDictionary from './SitecoreDictionary';

export enum DestinationType {
    Hotel = 'Hotel',
    Resort = 'Resort',
    Region = 'Region',
    Country = 'Country',
    Airport = 'Airport',
    Group = 'Group',
    VirtualRegion = 'VirtualRegion',
    VirtualCountry = 'VirtualCountry',
    VirtualResort = 'VirtualResort',
    Anywhere = 'Anywhere',

    //CustomMenu
    CustomHotel = 'HotelMenuItem',
    CustomResort = 'ResortMenuItem',
    CustomRegion = 'RegionMenuItem',
    CustomCountry = 'CountryMenuItem',
}

// Destination type bit flag is used to filter in backend
export enum DestinationTypeBit {
    All = 0,
    Country = 1,
    Region = 2,
    Resort = 4,
    Accommodation = 8,
    VirtualCountry = 16,
    VirtualRegion = 32,
}

export const DESTINATION_TYPE_DICTIONARY: Partial<Record<DestinationType, SitecoreDictionary>> = {
    [DestinationType.Country]: SitecoreDictionary.GlobalsDestinationTypesCountry,
    [DestinationType.VirtualCountry]: SitecoreDictionary.GlobalsDestinationTypesRegion,
    [DestinationType.VirtualRegion]: SitecoreDictionary.GlobalsDestinationTypesRegion,
    [DestinationType.Region]: SitecoreDictionary.GlobalsDestinationTypesRegion,
    [DestinationType.VirtualResort]: SitecoreDictionary.GlobalsDestinationTypesResort,
    [DestinationType.Resort]: SitecoreDictionary.GlobalsDestinationTypesResort,
    [DestinationType.Hotel]: SitecoreDictionary.GlobalsDestinationTypesHotel,
    [DestinationType.Airport]: SitecoreDictionary.GlobalsDestinationTypesAirport,
    [DestinationType.Group]: SitecoreDictionary.GlobalsDestinationTypesGroup,
};

export const VIRTUAL_DESTINATION_TYPES = [
    DestinationType.VirtualResort,
    DestinationType.VirtualCountry,
    DestinationType.VirtualRegion,
];
