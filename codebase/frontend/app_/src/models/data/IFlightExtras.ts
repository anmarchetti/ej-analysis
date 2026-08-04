import { HoldLuggageCategory } from 'models/enum/HoldLuggage';

export interface IFlightExtra {
    adultPrice: number;
    availableQuantity: number;
    categoryCode: string;
    childPrice: number;
    description: string;
    flightExtraCode: string;
    icon: string;
    limitPerPax: number;
    name: string;
}

export interface IFlightExtraCategory {
    categoryCode: string;
    categoryName: string;
    categoryType: HoldLuggageCategory;
    flightExtras: IFlightExtra[];
}

export interface IFlightExtras {
    flightExtraCategories: IFlightExtraCategory[];
    flightNumber: string;
    routeId: string;
}

export interface IExtraLuggageContent {
    description: string;
    icon: string;
    name: string;
    quantity: number;
    uniqueId?: string;
}

export interface ILargeSportEquipmentContent {
    name: string;
    quantity: number;
}

export interface IExtraLuggageContentWithPrice extends IExtraLuggageContent {
    price: number;
}

export interface ILuggageInfoItem extends IExtraLuggageContentWithPrice {
    isComplimentary: boolean;
    itemCategoryCode: string;
    itemCode: string;
    passengerId: string;
    routeId: string;
}

export interface IExtraLuggageInfo {
    items: ILuggageInfoItem[];
}

export interface ILuggageTrackingProductItem {
    price: number;
    quantity: number;
    routeId: string;
    title: string;
}
