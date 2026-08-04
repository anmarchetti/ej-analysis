import { Dispatch, SetStateAction } from 'react';
import Supercluster from 'supercluster';

import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

import { IStop } from './IItinerary';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IGeoPoint
    extends Supercluster.PointFeature<{ id: string; name?: string; price?: number; pricePP?: number }> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICluster extends Supercluster.ClusterFeature<{ price?: number; pricePP?: number }> {}

export interface IGeoPosition {
    lat: number;
    lng: number;
}

export interface IGeoPoints {
    features: IGeoPoint[];
    type: string;
}

export interface IPolyBounds {
    ln1: string;
    ln2: string;
    lt1: string;
    lt2: string;
}

export type TSelectedMapCardData = {
    hotel?: IGeoPoint;
    stop?: IStop;
} | null;

export type TSetSelectedMapCardData = Dispatch<SetStateAction<{ hotel?: IGeoPoint; stop?: IStop } | null>>;

export interface IMapFields {
    CTA: ISitecoreCompositeField<{ Link: ISitecoreField<ISitecoreLink> }>;
    ExploreContent: ISitecoreField<string>;
    MapImage: ISitecoreField<ISitecoreImage>;
}

export interface IMapParams {
    InitialZoom: string;
    MaxZoom: string;
    MinZoom: string;
}

export type TRestoreState = () => { selected: TSelectedMapCardData; zoomLevel: number } | null;
