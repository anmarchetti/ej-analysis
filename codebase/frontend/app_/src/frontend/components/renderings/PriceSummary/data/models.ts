import { ComponentFields, ComponentParams, ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import ColorScheme from 'models/enum/banners/ColorScheme';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { PromoCodeVariant } from 'models/enum/PromoCodeVariant';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

export interface IExportHolidayDetailsFields extends ComponentFields {
    Description: ISitecoreField<string>;
    DownloadLabel: ISitecoreField<string>;
    ExportAsImage: ISitecoreField<boolean>;
    ExportPromoDisabled: ISitecoreField<boolean>;
    ExportPromoLabel: ISitecoreField<string>;
    ExportPromoTooltip: ISitecoreField<string>;
    HideDownloadButton: ISitecoreField<boolean>;
    LogoCheckboxLabel: ISitecoreField<string>;
    LogoImage: ISitecoreField<ISitecoreImage>;
    Logos: ISitecoreField<ISitecoreImage>;
    ReadMoreLink: ISitecoreField<ISitecoreLink>;
    ReturnLabel: ISitecoreField<string>;
    ShowAgentLogoCheckboxLabel: ISitecoreField<string>;
    SkipTranslate: ISitecoreField<boolean>;
    Title: ISitecoreField<string>;
    YourHolidayDisclaimerText: ISitecoreField<string>;
    YourHolidayQuoteLabel: ISitecoreField<string>;
}

export interface IExportHolidayDetailsPlaceholder extends ComponentRendering {
    fields: IExportHolidayDetailsFields;
}

interface IPromocodeInputParameters extends ComponentParams {
    Variant: PromoCodeVariant;
}

export interface IPromocodeInputFields extends ComponentFields {
    AppliedLabel: ISitecoreField<string>;
    AppliedOfferText: ISitecoreField<string>;
    ApplyCodeText: ISitecoreField<string>;
    ColourScheme: ISitecoreField<ColorScheme>;
    IconGreatNewsBanner: ISitecoreField<ISitecoreImage>;
    OfferText: ISitecoreField<string>;
    Placeholder: ISitecoreField<string>;
    SalesText: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    TermsAndConditions: ISitecoreField<string>;
    TextGreatNewsBanner: ISitecoreField<string>;
    TitleGreatNewsBanner: ISitecoreField<string>;
    TooltipText: ISitecoreField<string>;
    UseCodeText: ISitecoreField<string>;
}

export interface IPromocodeInputPlaceholder extends ComponentRendering {
    fields: IPromocodeInputFields;
    params: IPromocodeInputParameters;
}

export interface IPriceSummaryRendering extends ComponentRendering {
    placeholders: {
        [PlaceholderNames.ExportHolidayDetails]: [IExportHolidayDetailsPlaceholder];
        [PlaceholderNames.PromocodeInput]: [IPromocodeInputPlaceholder];
    };
}
