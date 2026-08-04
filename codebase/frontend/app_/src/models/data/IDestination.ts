import { DestinationType } from 'models/enum/DestinationType';

import { MarketCode } from './MarketSettings';

export interface IDestination {
    code: string;
    name: string;
    available?: boolean;
    children?: IDestination[];
    giataCode?: string;
    hotelTypeIcon?: string;
    iso2?: string;
    itemName?: string;
    originCountry?: {
        code: MarketCode;
        name: string;
    };
    parents?: IDestination[];
    relatedRegions?: string[];
    relatedResorts?: string[];
    showOnSearchPod?: boolean;
    trackingHotelTheme?: string;
    type?: DestinationType;
}

export interface IVirtualDestination extends IDestination {
    relatedRegions: string[];
}
