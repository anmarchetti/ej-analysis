import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from './generic/ISitecoreField';

export interface IBoardItem {
    BoardType: ISitecoreCompositeField<IBoardTypeItem>;
    Content: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
}

interface IBoardTypeItem {
    Code: ISitecoreField<string>;
    Content: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
}
