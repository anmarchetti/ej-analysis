import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { ITimeSlot } from './ITimeSlot';
import { MarketCode } from './MarketSettings';

export interface IFilters {
    code: FilterGroupCodes;
    // for displaying name you this props, not code
    name: FilterGroupCodes;
    options: IFilterOption[];
}

export interface IBaseFilterOption {
    groupCode: FilterGroupCodes;
    name: string;
    trackingId?: string;
}

export interface IFilterOption extends IBaseFilterOption {
    code: string;
    count: number;
    atcomCode?: string;
    boardGroup?: IBoardGroup;
    children?: IFilterOption[];
    destinationInfo?: IFilterDestinationInfo;
    filterCode?: FilterGroupCodes;
    fullName?: string; // for recently used filters only, applicable for tripAdvisor, starRating and timeSlots options
    icon?: string;
    isExclusive?: boolean;
    maxTemp?: number;
    minTemp?: number;
    pillLabel?: string;
    preChecked?: boolean;
    selected?: boolean;
    showNewLabel?: boolean;
    timeSlot?: ITimeSlot;
    tooltipOrientation?: CalloutOrientation;
    tooltipPosition?: CalloutPosition;
    tooltipText?: string;
}

export interface IFilterDestinationInfo {
    parent: string;
    relatedRegions: string[]; // to do make it optional after investigation
    type: DestinationType;
    relatedResorts?: string[];
}

export interface ISelectedFilter {
    code: string;
    groupCode: FilterGroupCodes;
    name: string;
    atcomCode?: string;
    destinationInfo?: IFilterDestinationInfo;
    isExclusive?: boolean;
    originCountry?: {
        code: MarketCode;
        name: string;
    };
    preChecked?: boolean;
    timeSlot?: ITimeSlot;
}

export interface ITrackingFilterOption extends IBaseFilterOption {
    code?: string;
}

export interface IBoardGroup {
    code: string;
    name: string;
}

export interface IFilterOrderSetting {
    fields: {
        Code: ISitecoreField<FilterGroupCodes>;
        Name: ISitecoreField<string>;
    };
    id: string;
}

export interface ITimeFilterOptionSetting {
    fields: {
        Code: ISitecoreField<string>;
        EndTime: ISitecoreField<string>;
        Name: ISitecoreField<string>;
        StartTime: ISitecoreField<string>;
    };
    id: string;
}
