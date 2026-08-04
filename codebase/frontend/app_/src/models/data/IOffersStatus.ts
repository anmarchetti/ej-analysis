import { IBd4Tracking } from './IBd4Tracking';

export interface IOffersStatus {
    hasDiscont: boolean;
    maxPrice: number;
    maxPricePP: number;
    minPrice: number;
    minPricePP: number;
    total: number;
    tracking: IBd4Tracking;
}
