import { ICustomisableComponentParamsWithTitleTag } from 'models/data/ICustomisableComponentParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface ICarouselTile {
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}
export interface ITilesCarouselFields {
    IsLuxuryExclusive: ISitecoreField<boolean>;
    Tiles: ISitecoreCompositeField<ICarouselTile>[];
    Title: ISitecoreField<string>;
    UseHotelTiles: ISitecoreField<boolean>;
    Variant: ISitecoreField<TilesCarouselVariant>;
}

export interface ITilesCarouselWithClassNamesProps extends ITilesCarouselFields {
    titleClassName: string;
    titleTag: string;
    wrapperClassName: string;
}

export type TTilesCarouselProps = ISitecoreComponent<ITilesCarouselFields, ICustomisableComponentParamsWithTitleTag>;

export enum TilesCarouselVariant {
    TextOnImage = 'Text On Image',
    InformationBelowTiles = 'Information Below Tiles',
}
