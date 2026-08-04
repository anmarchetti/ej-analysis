import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IDestinationHighlightItem {
    fields: {
        Description: ISitecoreField<string>;
        Title: ISitecoreField<string>;
        Image?: ISitecoreField<ISitecoreImage>;
    };
    id: string;
}
