import { RoomAllocation } from 'models/RoomAllocation';

import { IGeoPoints } from './map/IMap';
import { IBd4Tracking } from './IBd4Tracking';
import { IFilters } from './IFilters';
import { IOffer } from './IOffer';

interface ISearchStatus {
    hasDiscont: boolean;
    maxPrice: number;
    maxPricePP: number;
    minPrice: number;
    minPricePP: number;
    total: number;
    tracking?: IBd4Tracking;
}

export interface ISearchOffers {
    filters: IFilters[];
    offers: IOffer[];
    reorderFilters: boolean;
    status: ISearchStatus;
}

export interface IFilteredPoints {
    filters: IFilters[];
    geoOffers: IGeoPoints;
    status: ISearchStatus;
}

export interface ISearchParams {
    flexDays: number;
    from: Date | null;
    isAutoAllocation: boolean;
    origins: string[];
    roomsAllocation: RoomAllocation[];
    selectedDestinationCodes: string[];
    selectedDestinationCodesQuery: string;
    to: Date | null;
}
