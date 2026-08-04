import { ISitecoreField } from './generic/ISitecoreField';

export interface IAirport {
    code: string;
    name: string;
    airports?: IAirport[];
    countryName?: string;
    hasDepartureAirports?: boolean;
    isDepartureAirport?: boolean;
    // the same as name but in english, for analytic non-english markets
    itemName?: string;
    latitude?: string;
    longitude?: string;
}

export interface ISitecoreAirport {
    Code: ISitecoreField<string>;
    Name: ISitecoreField<string>;
    AutoTranslate?: ISitecoreField<boolean>;
    IsDepartureAirport?: ISitecoreField<boolean>;
    Latitude?: ISitecoreField<string>;
    Longitude?: ISitecoreField<string>;
    SkipTranslate?: ISitecoreField<boolean>;
}

export interface IAirportCountry {
    airports: IAirport[];
    code: string;
    hasDepartureAirports: boolean;
    name: string;
    itemName?: string;
}
