import { IDestinationFields } from 'models/data/IDestinationFields';
import { IRequestedPriceFields } from 'models/data/IRequestedPriceFields';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IDealsDestinationCardFields {
    Country: ISitecoreCompositeField<IDestinationFields>;
    Image: ISitecoreField<ISitecoreImage>;
    Tiles: IDealsDestinationTile[];
    Title: ISitecoreField<string>;
}

export interface IDealsDestinationsCard {
    fields: IDealsDestinationCardFields;
    id: string;
}

export interface IDealsDestinationTileFields extends IRequestedPriceFields {
    Destination: ISitecoreCompositeField<IDestinationFields>[];
}

export interface IDealsDestinationTile {
    fields: IDealsDestinationTileFields;
    id: string;
}
