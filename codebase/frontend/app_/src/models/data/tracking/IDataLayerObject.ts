import { IProduct } from 'frontend/utils/tracking/trackOffer.utils';
import { ISmartSeerResultObject } from 'models/data/IHolidayInspiration';
import { IPoorEvent } from 'models/data/IPoorEvent';

import {
    IAncillariesEcommerceObject,
    IEcommerceObject,
    ISearchCriteria,
    IShortlistEcommerceObject,
} from './IEcommerceObject';
import { IEventWithParamsDLObject } from './IEventWithParams';
import { IPageLoadObject } from './IPageLoadObject';
import { IRecommenderEvent } from './IRecommenderEvent';

interface IErrorEvent extends IPoorEvent {
    dimension86: string | number;
    dimension87: string;
    dimension88: string;
}

interface IPromoCodeEvent extends IPoorEvent {
    dimension139: string;
    dimension15: string;
    dimension63: string;
    dimension64: number;
}

interface ICreditEvent extends IPoorEvent {
    dimension156: string;
}

interface IChangeDateEvent extends IPoorEvent {
    dimension182: string;
    metric6: number;
}

interface IDestinationGuideEvent extends IPoorEvent {
    currencyCode: string;
    dimension22: string;
    dimension23: string;
    dimension24: string;
    dimension25: string;
    dimension26: string;
    dimension27: string;
    dimension28: string;
}

interface IShortlistEvent extends IPoorEvent {
    products: IProduct[];
}

interface IOptimizelyDecisionEvent extends IPoorEvent {
    flagKey: string;
    isEnabled: boolean;
    language: string;
    ruleKey: Nullable<string>;
    site: string;
    userId: string;
    variationKey: Nullable<string>;
}

interface IValidationEvent extends IPoorEvent {
    dimension93: string;
    dimension94: string;
}

export type TDataLayerObject =
    | IAncillariesEcommerceObject
    | IEcommerceObject
    | IShortlistEcommerceObject
    | IPageLoadObject
    | IEventWithParamsDLObject
    | IRecommenderEvent
    | IPromoCodeEvent
    | ICreditEvent
    | IDestinationGuideEvent
    | IChangeDateEvent
    | IShortlistEvent
    | ISmartSeerResultObject
    | IErrorEvent
    | IPoorEvent
    | ISearchCriteria
    | IOptimizelyDecisionEvent
    | IValidationEvent
    | null;
