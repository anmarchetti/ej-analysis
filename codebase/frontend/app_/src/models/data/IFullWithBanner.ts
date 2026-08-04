import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

import { ICustomisableTitleFontParams } from './ICustomisableComponentParams';

export enum TitleStyleType {
    Thin = 'thin',
    Bold = 'bold',
}

export enum TextAlignmentVariant {
    Right = 'right',
    Left = 'left',
}

export enum ComponentVersion {
    GenericContent = 'GenericContentWithoutShard',
    NonSlimWithoutShard = 'NonSlimWithoutShard',
    NonSlimWithShard = 'NonSlimWithShard',
    SlimWithoutShard = 'SlimWithoutShard',
    SlimWithShard = 'SlimWithShard',
    SlimWithShardMirrored = 'SlimWithShardMirrored',
    WithKeySellingPoints = 'WithKeySellingPoints',
}

export enum CTAThemeType {
    Outlined = 'outlined',
    Filled = 'filled',
    Url = 'URL',
}

export enum PillColourVariant {
    Red = 'red',
    Yellow = 'yellow',
    Green = 'green',
    Black = 'black',
}

export interface IBannerKeySellingPoint {
    Icon: ISitecoreField<ISitecoreImage>;
    Label: ISitecoreField<string>;
}

export interface IBannerKeySellingPoints {
    Items: ISitecoreCompositeField<IBannerKeySellingPoint>[];
}

export interface IFullWidthBannerParameters extends ICustomisableTitleFontParams {
    CTATheme: CTAThemeType;
    PillColour: PillColourVariant;
    TextAlignment: TextAlignmentVariant;
    Version: ComponentVersion;
}

export interface IFullWidthBannerFields {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    IsLuxuryBadge: ISitecoreField<boolean>;
    KeySellingPoints: ISitecoreCompositeField<IBannerKeySellingPoints>;
    PillText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TrackingTitle: ISitecoreField<string>;
}

export type TFullWidthBannerProps = ISitecoreComponent<IFullWidthBannerFields, IFullWidthBannerParameters>;
