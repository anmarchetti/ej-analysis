import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { IDestinationHighlightItem } from './IDestinationHighlightItem';

export interface IDestinationHighlightTabItem {
    fields: IDestinationHighlightTab;
    id: string;
}

export interface IDestinationHighlightTab {
    Highlights: IDestinationHighlightItem[];
    Title: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
}
