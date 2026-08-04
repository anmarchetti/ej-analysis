import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export enum CompareOption {
    TripAdvisor = 'TripAdvisor',
    CustomerRating = 'CustomerRating',
    Dates = 'Dates',
    Duration = 'Duration',
    DepartureAirport = 'DepartureAirport',
    OutboundFlightTime = 'OutboundFlightTime',
    ReturnFlightTime = 'ReturnFlightTime',
    BoardType = 'BoardType',
    RoomType = 'RoomType',
    TransferType = 'TransferType',
    Bags = 'Bags',
    Facilities = 'Facilities',
    Location = 'Location',
}

export interface ICriterion {
    fields: {
        MissingDataLabel: ISitecoreField<string>;
        Name: ISitecoreField<string>;
        Type: ISitecoreField<string>;
    };
    id: string;
}

export interface IComparisonTableFields {
    ComparisonCriteria: ICriterion[];
    FallbackLabel: ISitecoreField<string>;
}
