import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from './generic/ISitecoreField';

export interface IRoomItem {
    Code: ISitecoreField<string>;
    Content: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    RoomType: ISitecoreCompositeField<IRoomTypeItem>[];
    RoomsFolder?: string;
}

interface IRoomTypeItem {
    Code: ISitecoreField<string>;
    Content: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
}
