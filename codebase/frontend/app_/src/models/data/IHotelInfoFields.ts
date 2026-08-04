import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { ISitecoreChildren } from './ISitecoreChildren';

export interface IHotelInfoFields {
    Address: ISitecoreField<string>;
    City: ISitecoreField<string>;
    ClosestFacility: {
        Distance?: ISitecoreField<number>;
        Name?: ISitecoreField<string>;
        fields?: IClosestFacilityFields;
    };
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    EcoFacility: {
        Name?: ISitecoreField<string>;
        Tooltip?: ISitecoreField<string>;
    };
    Facilities: IFacilityFields[];
    GiataCode: ISitecoreField<string>;
    GreatDeal: ISitecoreField<boolean>;
    HotelDescription: ISitecoreField<string>;
    HotelPhone: ISitecoreField<string>;
    HotelRating: ISitecoreField<string>;
    HotelTheme: ISitecoreCompositeField<IHotelThemeFields>;
    KeySellingPoint1: ISitecoreField<string>;
    KeySellingPoint2: ISitecoreField<string>;
    Latitude: ISitecoreField<string>;
    Longitude: ISitecoreField<string>;
    Name: ISitecoreField<string>;
    PageCategory: ISitecoreField<string>;
    PageTitle: ISitecoreField<string>;
    PostalCode: ISitecoreField<string>;
    Resort: ISitecoreField<string>;
    StarRating: ISitecoreField<string>;
    StrapLine: ISitecoreField<string>;
    TotalNumberOfReviews: ISitecoreField<string>;
    TripAdvisorId: ISitecoreField<string>;
    Types: ISitecoreCompositeField<IHotelThemeTypeFields>[];
    items: [
        {
            children: IItinerary[];
        },
    ];
}

export interface IClosestFacilityFields {
    Distance: ISitecoreField<number>;
    FacilityType: [
        {
            fields: {
                Name: ISitecoreField<string>;
            };
        },
    ];
}

interface IItinerary {
    children: IRoute[];
    displayName: string;
    fields: IItineraryFields;
    id: string;
    name: string;
}

interface IRoute {
    displayName: string;
    fields: IRouteFields;
    id: string;
    name: string;
}

interface IRouteFields {
    ActiveIcon: ISitecoreImage;
    Description: ISitecoreField<string>;
    Duration: ISitecoreField<string>;
    Latitude: ISitecoreField<string>;
    Longitude: ISitecoreField<string>;
    Name: ISitecoreField<string>;
    NonActiveIcon: ISitecoreImage;
    RouteType: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
}

interface IItineraryFields {
    CentralPointLatidiute: ISitecoreField<string>;
    CentralPointLongitude: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Duration: ISitecoreField<string>;
    Image: ISitecoreImage;
    Name: ISitecoreField<string>;
    RouteType: ISitecoreField<string>;
    TotalDistance: ISitecoreField<string>;
    Zoom: ISitecoreField<string>;
}

export interface IHotelThemeTypeFields {
    Bd4ThemeTypeCode: ISitecoreField<string>;
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    DestinationGuideTitle: ISitecoreField<string>;
    DestinationGuideUrl: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    IsExclusive?: ISitecoreField<boolean>;
}

export interface IHotelThemeFields {
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    DestinationGuideTitle: ISitecoreField<string>;
    DestinationGuideUrl: ISitecoreField<string>;
    Icon: ISitecoreImage;
    Name: ISitecoreField<string>;
    PackageIcons: ISitecoreChildren<IPackageIconFields>[];
    IsExclusive?: ISitecoreField<boolean>;
}

export interface IPackageIconFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    Type: ISitecoreField<PackageIconTypes>;
    BagType?: {
        fields: {
            Code: ISitecoreField<string>;
        };
    };
}

export interface IExcludedDestinations {
    fields: {
        Name: ISitecoreField<string>;
    };
    id: string;
    url: string;
}

interface IFacilityFields {
    FacilityCode: string;
    FacilityGroupCode: string;
    IsErrataInfo: true;
    Name: string;
}
