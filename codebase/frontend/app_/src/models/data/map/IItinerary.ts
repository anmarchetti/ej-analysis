import { IImage } from 'models/data/IHotel';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { IGeoPosition } from './IMap';

export interface ITourSitecoreInfo {
    Description: ISitecoreField<string>;
    Duration: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Latitude: ISitecoreField<string>;
    Longitude: ISitecoreField<string>;
    Name: ISitecoreField<string>;
    RouteType: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    TotalDistance: ISitecoreField<string>;
}

export interface ITourChildren {
    children: any[];
    fields: ITourSitecoreInfo;
    id: string;
}

export interface ITour {
    children: ITourChildren[];
    displayName: string;
    fields: {
        CentralPointLatidiute: ISitecoreField<string>;
        CentralPointLongitude: ISitecoreField<string>;
        Description: ISitecoreField<string>;
        Duration: ISitecoreField<string>;
        Image: ISitecoreField<ISitecoreImage>;
        Name: ISitecoreField<string>;
        TotalDistance: ISitecoreField<string>;
        Zoom: ISitecoreField<number>;
    };
    id: string;
}

export interface IStop {
    description: string;
    duration: string;
    id: string;
    images: IImage[];
    name: string;
    position: IGeoPosition;
    subtitle: string;
    travelMode: google.maps.TravelMode;
}

export type TOnRouteChange = (legs: { route: google.maps.DirectionsLeg }[]) => void;

export type TRouteHelperBasic = { info: google.maps.InfoWindow | null };

export type TRouteHelper = TRouteHelperBasic & {
    polyline: google.maps.Polyline | null;
    stops: IStop[];
};
