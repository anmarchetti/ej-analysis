import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { IModalContentFields } from 'frontend/components/renderings/ContentModal/ContentModal';

import { ILivePrice, ILivePriceOptionFields } from './ILivePrice';

export interface IPromoBlockFields {
    fields: IPromoBlockBaseFields &
        IPromoBlockBigVariantFields &
        ILivePriceOptionFields & {
            DataPromotion?: ISitecoreField<string>;
            Large?: ISitecoreField<string>;
            Medium?: ISitecoreField<string>;
            Small?: ISitecoreField<string>;
        };
    id: string;
    isLivePriceValid?: boolean;
    livePrice?: Nullable<ILivePrice>;
}

interface IPromoBlockBigVariantFields {
    CTAText?: ISitecoreField<string>;
    PillPrice?: ISitecoreField<string>;
    PillText?: ISitecoreField<string>;
}

export interface IPromoBlockBaseFields {
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    ModalContent: IModalContentField;
    Title: ISitecoreField<string>;
}

export interface IPromoBlocksGlobalFields {
    Children: IPromoBlockFields[];
    EnableNumberOfNights?: ISitecoreField<boolean>;
    EnableTouristTaxGenericTooltip?: ISitecoreField<boolean>;
    FeaturedFacilities?: ISitecoreField<boolean>;
    Link?: ISitecoreField<ISitecoreLink>;
}

export interface IPromoBlockProps {
    items: IPromoBlockFields[];
    isButtonOutlined?: boolean;
    onItemLinkClick?: (item: IPromoBlockFields, index: number) => void;
    titleClassName?: string;
}

export interface IModalContentField {
    fields: IModalContentFields;
}
