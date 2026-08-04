import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { ShowOn } from 'models/enum/ShowOn';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';
import {
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
    ISitecoreProperty,
} from 'models/sitecore/generic/ISitecoreField';

export default interface INavLink {
    fields: {
        Link: ISitecoreField<ISitecoreLink>;
        AllowedRoles?: ISitecoreProperty<TradeUserRoles>[];
        ChildrenLinks?: INavLink[];
        EnableNoFollowTag?: ISitecoreField<boolean>;
        FeaturedLinks?: INavLink[];
        Image?: ISitecoreField<ISitecoreImage>;
        IsShortList?: ISitecoreField<boolean>;
        Name?: ISitecoreField<string>;
        OneColumn?: ISitecoreField<boolean>;
        PromotionalComponent?: IPromoBlockFields;
        ShowOn?: ISitecoreField<ShowOn>;
    };
    id: string;
}
