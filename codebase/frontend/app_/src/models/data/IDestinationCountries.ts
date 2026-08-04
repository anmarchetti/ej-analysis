import { DestinationType } from 'models/enum/DestinationType';

import { IDestination } from './IDestination';
import { MarketCode } from './MarketSettings';

export interface IDestinationCountry {
    code: string;
    name: string;
    children?: IDestinationCountry[];
    hotelTypeIcon?: string;
    // the same as name but in english, for analytic non-english markets
    itemName?: string;
    originCountry?: {
        code: MarketCode;
        name: string;
    };
    parents?: IDestination[];
    relatedRegions?: string[];
    relatedResorts?: string[];
    showOnSearchPod?: boolean;
    type?: DestinationType;
}
