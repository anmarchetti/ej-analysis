import { EventTypes } from 'models/enum/tracking/EventTypes';

export interface IRecommenderEvent {
    dimension13: string; // timestamp,
    dimension136: string; // pageName
    dimension143: string; // pToken
    dimension147: string; // placementId
    dimension150: any; // recoInfo
    event: EventTypes;
    dimension148?: number; // listOffset
    dimension149?: number; // totalItems
    dimension15?: number; // total price
    dimension151?: string; // issueType
    dimension152?: number; // listPreviousOffset,
    dimension153?: number; // pageSize or slidesToShow,
    dimension154?: string; // medium
    dimension155?: number; // listPosition
    id?: string;
    pageReferral?: string;
    price?: number; // pricePP
    recommender?: {
        dimension15: number;
        id: string;
        price: number;
        position?: number;
        tracking?: { campaignInfo?: string[] };
    }[];
    tracking?: { campaignInfo?: string[] };
}
