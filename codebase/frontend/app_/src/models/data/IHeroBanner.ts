import { TitleFontSizeMobileAndDesktopBanner, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import PageHeroBannerHeightOptions from 'models/enum/PageHeroBannerHeightOptions';
import PageHeroBannerTextOrderOptions from 'models/enum/PageHeroBannerTextOrderOptions';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { ICreditAnchorFields } from 'frontend/components/common/CreditAnchor/CreditAnchor';

import { IRegionsFields, IResortsFields } from './IDestinationFields';
import { ILivePrice } from './ILivePrice';

export interface IHeroBannerHeadingFields {
    Name: ISitecoreField<string>;
    ComposedTitle?: ISitecoreField<string>;
    Subtitle?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

export interface IHeroBannerHeadingProps extends IHeroBannerHeadingFields {
    className?: Nullable<string>;
}

export interface IHeroBannerCategoryFields {
    PageCategory: ISitecoreField<string>;
}

// rendering use context item resolver (not data source), that why most of the fields are optional
export interface IHeroBannerFields
    extends Partial<ICreditAnchorFields>,
        IRegionsFields,
        IResortsFields,
        IHeroBannerHeadingFields,
        IHeroBannerCategoryFields {
    PageDescription: ISitecoreField<string>;
    Code?: ISitecoreField<string>;
    DealPageLink?: ISitecoreField<ISitecoreLink>;
    Icon?: ISitecoreField<ISitecoreImage>;
    Image?: ISitecoreField<ISitecoreImage>;
    Logo?: ISitecoreField<ISitecoreImage>;
}

export interface IHeroBannerParameters {
    FontSize?: TitleFontSizeMobileAndDesktopBanner;
    Height?: PageHeroBannerHeightOptions;
    IsTriangleGrey?: TSitecoreCheckboxValue;
    IsTriangleStart?: TSitecoreCheckboxValue;
    ShowImageGradient?: TSitecoreCheckboxValue;
    TextOrder?: PageHeroBannerTextOrderOptions;
    TitleFontStyle?: TitleFontStyle;
    TitleTag?: string;
    Variant?: PageHeroBannerVariants;
}

export type THeroBannerProps = ISitecoreComponent<IHeroBannerFields, IHeroBannerParameters>;

export interface ISSRPageHeroBannerProps {
    cheapestLivePriceForDestinationPage: ILivePrice | null | undefined;
}

export type TSubHeroBannerProps = THeroBannerProps & ISSRPageHeroBannerProps;
