import SitecoreLinkType from 'models/enum/SitecoreLinkType';

export interface ISitecoreImage {
    [attributeName: string]: unknown;
    src: string;
    alt?: string;
    class?: string;
    dfx?: number | string;
    dfy?: number | string;
    height?: number;
    mfx?: number | string;
    mfy?: number | string;
    priority?: boolean;
    width?: number;
}

export interface ICompressedSitecoreLink {
    Id: string;
    Name: string;
    Url: string;
}

export interface ISitecoreLink {
    [attributeName: string]: unknown;
    href: string;
    linktype: SitecoreLinkType;
    text: string;
    anchor?: string;
    id?: string;
    querystring?: string;
    rel?: string;
    target?: string;
    title?: string;
    url?: string;
}

export interface ISitecoreField<T> {
    value: T;
}

export interface ISitecoreCompositeField<T> {
    fields: T;
    id: string;
    url?: string;
}

export interface ISitecoreMultiListItem<T> {
    fields: {
        Value: T;
    };
    id: string;
}

export interface ISitecoreRenderField {
    componentName: string;
    dataSource: string;
    placeholders: any;
    uid: string;
    fields?: any;
}

export interface ISitecoreImageItem {
    displayName: string;
    fields: {
        Image: ISitecoreField<ISitecoreImage>;
        Link: ISitecoreField<ISitecoreLink>;
    };
    id: string;
    name: string;
}

export interface ISitecoreImageExternalItem {
    displayName: string;
    fields: {
        Code: ISitecoreField<string>;
        Large: ISitecoreField<string>;
        Medium: ISitecoreField<string>;
        ShowOnSite: ISitecoreField<boolean>;
        Small: ISitecoreField<string>;
    };
    id: string;
    name: string;
}

export interface ISitecoreSettingsLink {
    Anchor: string;
    LinkType: SitecoreLinkType;
    Target: string;
    Text: string;
    Url: string;
}

export interface ISitecoreProperty<T> {
    fields: {
        Value: ISitecoreField<T>;
    };
}

export type TSitecoreMultiList<T> = Array<ISitecoreCompositeField<T>>;
