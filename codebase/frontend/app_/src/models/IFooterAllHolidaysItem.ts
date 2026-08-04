import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

export interface IFooterAllHolidaysItem {
    displayName: string;
    id: string;
    name: string;
    url: string;
    fields?: {
        ListOfSubtitles: IFooterSubtitle[];
        Title: ISitecoreField<string>;
    };
}

export interface IFooterSubtitle {
    fields: {
        Subtitle: ISitecoreField<string>;
        SubtitleLink: ISitecoreField<ISitecoreLink>;
    };
    id: string;
}
