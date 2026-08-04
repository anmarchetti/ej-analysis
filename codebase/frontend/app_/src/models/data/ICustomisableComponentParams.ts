import {
    ContainerPaddingOptions,
    TextPosition,
    TitleFontSizeMobileAndDesktop,
    TitleFontStyle,
    TitleWeight,
} from 'models/enum/CustomisableComponentsParameters';

export interface ICustomisableTitleAndDescriptionParams extends ICustomisableComponentParamsWithTitleTag {
    DescriptionPosition?: TextPosition;
}

export interface ICustomisableComponentParamsWithTitleTag extends ICustomisableComponentParams {
    TitleTag?: string;
}

export interface ICustomisableComponentParams extends ICustomisableTitleFontParams {
    PaddingSize?: ContainerPaddingOptions;
    TitlePosition?: TextPosition;
    TitleWeight?: TitleWeight;
}

export interface ICustomisableTitleFontParams {
    TitleFontSize?: TitleFontSizeMobileAndDesktop;
    TitleFontStyle?: TitleFontStyle;
}
